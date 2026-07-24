import { redirect } from 'next/navigation';

type Ctx = { params: Promise<{ id: string }> };

export default async function EnviosDetalleRedirect({ params }: Ctx) {
  const { id } = await params;
  redirect(`/delivery/${id}`);
}
