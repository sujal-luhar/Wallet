interface AuthCardWrapperProps {
  title: string;
  error?: string | null;
  children: React.ReactNode;
}

export function AuthCardWrapper({ title, error, children }: AuthCardWrapperProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-8 shadow-sm border border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
          {title}
        </h1>

        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200">
            {error}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}