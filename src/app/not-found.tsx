import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-x max-w-xl py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Erreur 404</p>
      <h1 className="mt-2 text-3xl font-extrabold text-brand-800">Cette page n&apos;existe pas</h1>
      <p className="mt-3 text-slate-600">Le lien est peut-être erroné ou la page a été déplacée.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn-dark">Accueil</Link>
        <Link href="/commander" className="btn-primary">Commander un transport</Link>
      </div>
    </main>
  );
}
