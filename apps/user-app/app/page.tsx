// export default function Home() {
//   return (
//     <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//             USER APP
//           </h1>
//     </div>
//   );
// }

import { db } from "@wallet/db";

export default async function Home() {
  const users = await db.user.findMany();

  return (
    <div>
      <h1>Total Users: {users.length}</h1>
    </div>
  );
}
