"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { file, z } from "zod";
import { Upload, ImageIcon, X } from "lucide-react";

import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_PDF_TYPES,
  DEFAULT_VOICE,
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
  voiceCategories,
  voiceOptions,
} from "@/lib/constants";
import { cn, parsePDFFile } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from 'sonner';
import { checkBookExists, createBook, saveBookSegments } from "@/lib/actions/book.actions";
import { useRouter } from "next/navigation";
import { upload } from '@vercel/blob/client';

type VoiceKey = keyof typeof voiceOptions;

const pdfFileSchema = z
  .instanceof(File, { message: "Please upload a PDF file" })
  .refine(
    (file) => ACCEPTED_PDF_TYPES.includes(file.type),
    "File must be a PDF",
  )
  .refine((file) => file.size <= MAX_FILE_SIZE, "PDF must be 50MB or smaller");

const coverImageSchema = z
  .instanceof(File)
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    "Cover must be a JPG, PNG, or WEBP image",
  )
  .refine(
    (file) => file.size <= MAX_IMAGE_SIZE,
    "Cover image must be 10MB or smaller",
  )
  .optional();

const voiceKeys = Object.keys(voiceOptions) as [VoiceKey, ...VoiceKey[]];

const formSchema = z.object({
  pdf: pdfFileSchema,
  cover: coverImageSchema,
  title: z.string().trim().min(1, "Please enter a title"),
  author: z.string().trim().min(1, "Please enter an author name"),
  voice: z.enum(voiceKeys),
});

type FormValues = z.infer<typeof formSchema>;

const UploadForm = () => {
  const { userId } = useAuth();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      author: "",
      voice: DEFAULT_VOICE as VoiceKey,
    },
    mode: "onSubmit",
  });

  const onSubmit = async (values: FormValues) => {
    if (!userId) {
      toast.error("Please sign in to upload a book");
      return;
    };
    setIsSubmitting(true);
    try {
      const existsCheck = await checkBookExists(values.title);

      if (existsCheck.exists && existsCheck.book) {
        toast.info("Book already exists");
        form.reset()
        router.push(`/book/${existsCheck.book.slug}`);
        return;
      }

      const fileTitle = values.title.replace(/\s+/g, '-').toLowerCase();

      const pdfFile = values.pdf;

      const parsedPDF = await parsePDFFile(pdfFile);

      if (!parsedPDF.content.length) {
        toast.error("Failed to parse PDF file");
        return;
      }

      const uploadedPdfBlob = await upload(fileTitle, pdfFile, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        contentType: ACCEPTED_PDF_TYPES.join(","),
      })

      let coverURL: string;

      if (values.cover) {
        const coverFileName = `${fileTitle}_cover.png`;
        const uploadedCoverBlob = await upload(coverFileName, values.cover, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          contentType: values.cover.type,
        })

        coverURL = uploadedCoverBlob.url;
      } else {
        const response = await fetch(parsedPDF.cover);
        const coverBlob = await response.blob();
        const coverFileName = `${fileTitle}_cover.png`;
        const uploadedCoverBlob = await upload(coverFileName, coverBlob, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          contentType: 'image/png',
        })

        coverURL = uploadedCoverBlob.url;
      }

      const book = await createBook({
        clerkId: userId,
        title: values.title,
        author: values.author,
        persona: values.voice,
        fileURL: uploadedPdfBlob.url,
        fileBlobKey: uploadedPdfBlob.pathname,
        coverURL,
        fileSize: pdfFile.size
      })

      if (!book.success) {
        throw new Error('failes')
      }

      if (book.alreadyExists) {
        toast.info("Book already exists");
        form.reset()
        router.push(`/book/${existsCheck.book.slug}`);
        return;
      }

      const segments = await saveBookSegments(book.data._id, userId, parsedPDF.content);

      if (!segments.success) {
        toast.error('Failed to save book segments');
        throw new Error("Failed to save book")
      }

      toast.success('Book uploaded successfully');
      form.reset();
      router.push(`/book/${book.data.slug}`);

    } catch (error) {
      console.error(error);
      toast.error("Failed to upload book");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="new-book-wrapper">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
          noValidate
        >
          <FormField
            control={form.control}
            name="pdf"
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormLabel className="form-label">Book PDF File</FormLabel>
                <FormControl>
                  <div>
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => onChange(e.target.files?.[0])}
                    />
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      className={cn(
                        "upload-dropzone w-full",
                        value && "upload-dropzone-uploaded",
                      )}
                    >
                      {value ? (
                        <div className="flex items-center gap-3">
                          <span className="upload-dropzone-text">
                            {value.name}
                          </span>
                          <span
                            role="button"
                            tabIndex={0}
                            aria-label="Remove PDF"
                            className="upload-dropzone-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              onChange(undefined);
                              if (pdfInputRef.current) {
                                pdfInputRef.current.value = "";
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation();
                                onChange(undefined);
                                if (pdfInputRef.current) {
                                  pdfInputRef.current.value = "";
                                }
                              }
                            }}
                          >
                            <X className="size-4" />
                          </span>
                        </div>
                      ) : (
                        <>
                          <Upload className="upload-dropzone-icon" />
                          <span className="upload-dropzone-text">
                            Click to upload PDF
                          </span>
                          <span className="upload-dropzone-hint">
                            PDF file (max 50MB)
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cover"
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormLabel className="form-label">
                  Cover Image (Optional)
                </FormLabel>
                <FormControl>
                  <div>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept={ACCEPTED_IMAGE_TYPES.join(",")}
                      className="hidden"
                      onChange={(e) => onChange(e.target.files?.[0])}
                    />
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className={cn(
                        "upload-dropzone w-full",
                        value && "upload-dropzone-uploaded",
                      )}
                    >
                      {value ? (
                        <div className="flex items-center gap-3">
                          <span className="upload-dropzone-text">
                            {value.name}
                          </span>
                          <span
                            role="button"
                            tabIndex={0}
                            aria-label="Remove cover image"
                            className="upload-dropzone-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              onChange(undefined);
                              if (coverInputRef.current) {
                                coverInputRef.current.value = "";
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation();
                                onChange(undefined);
                                if (coverInputRef.current) {
                                  coverInputRef.current.value = "";
                                }
                              }
                            }}
                          >
                            <X className="size-4" />
                          </span>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="upload-dropzone-icon" />
                          <span className="upload-dropzone-text">
                            Click to upload cover image
                          </span>
                          <span className="upload-dropzone-hint">
                            Leave empty to auto-generate from PDF
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Title</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="ex: Rich Dad Poor Dad"
                    className="form-input h-auto"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Author Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="ex: Robert Kiyosaki"
                    className="form-input h-auto"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="voice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">
                  Choose Assistant Voice
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="space-y-4"
                  >
                    {(
                      [
                        ["Male Voices", voiceCategories.male],
                        ["Female Voices", voiceCategories.female],
                      ] as const
                    ).map(([label, keys]) => (
                      <div key={label} className="space-y-2">
                        <p className="text-sm text-[var(--text-secondary)]">
                          {label}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {keys.map((key) => {
                            const voice = voiceOptions[key as VoiceKey];
                            const isSelected = field.value === key;
                            return (
                              <label
                                key={key}
                                htmlFor={`voice-${key}`}
                                className={cn(
                                  "voice-selector-option flex-col !items-start text-left",
                                  isSelected
                                    ? "voice-selector-option-selected"
                                    : "voice-selector-option-default",
                                )}
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <RadioGroupItem
                                    value={key}
                                    id={`voice-${key}`}
                                  />
                                  <span className="font-semibold text-[var(--text-primary)]">
                                    {voice.name}
                                  </span>
                                </div>
                                <p className="text-sm text-[var(--text-secondary)] mt-1 pl-7">
                                  {voice.description}
                                </p>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="form-btn disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Begin Synthesis
          </button>
        </form>
      </Form>

      {isSubmitting && <LoadingOverlay />}
    </div>
  );
};

export default UploadForm;
