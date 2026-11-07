interface AuthCardWrapperProps {
  title: string;
  children: React.ReactNode;
}

export function AuthCardWrapper({ title, children }: AuthCardWrapperProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-8 shadow-sm border border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}