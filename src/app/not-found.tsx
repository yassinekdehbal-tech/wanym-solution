import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-x max-w-xl py-24 text-center">
      <p className="eyebrow">Erreur 404</p>
      <h1 className="h1 mt-2 text-brand-800">Cette page n&apos;existe pas</h1>
      <p className="lead mt-3">Le lien est peut-être erroné ou la page a été déplacée.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn-dark">Accueil</Link>
        <Link href="/commander" className="btn-primary">Commander un transport</Link>
      </div>
    </main>
  );
}
