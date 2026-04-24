import UploadForm from "@/components/UploadForm";
import { auth } from "@clerk/nextjs/server";

const Page = async () => {
  await auth.protect();
  return (
    <main className="wrapper container">
      <div className="mx-auto max-w-180 space-y-10">
        <section className="flex flex-col gap-5">
          <h1 className="page-title-xl">Add a new pdf</h1>
          <p className="subtitle">
            Upload a PDF to generate your interactive chat
          </p>
        </section>

        <UploadForm />
      </div>
    </main>
  );
};

export default Page;
