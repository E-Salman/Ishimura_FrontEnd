import MarcasGrid from "./MarcasGrid";

const MARCAS = [
  {
    id: "hasbro",
    title: "Hasbro",
    description: "Juguetes y figuras de acción icónicas.",
    image: "https://placehold.co/800x600/png?text=Hasbro",
    slug: "hasbro",
  },
  {
    id: "bandai",
    title: "Bandai",
    description: "Gunpla, anime y cultura pop japonesa.",
    image: "https://placehold.co/800x600/png?text=Bandai",
    slug: "bandai",
  },
  {
    id: "funko",
    title: "Funko",
    description: "Vinyl Pops y coleccionables stylized.",
    image: "https://placehold.co/800x600/png?text=Funko",
    slug: "funko",
  },
  {
    id: "mattel",
    title: "Mattel",
    description: "Barbie, Hot Wheels y más clásicos.",
    image: "https://placehold.co/800x600/png?text=Mattel",
    slug: "mattel",
  },
  {
    id: "lego",
    title: "LEGO",
    description: "Construcciones creativas para todas las edades.",
    image: "https://placehold.co/800x600/png?text=LEGO",
    slug: "lego",
  },
  {
    id: "neca",
    title: "NECA",
    description: "Figuras detalladas de cine y TV.",
    image: "https://placehold.co/800x600/png?text=NECA",
    slug: "neca",
  },
  {
    id: "mcfarlane",
    title: "McFarlane Toys",
    description: "Esculturas y licencias de cómics y gaming.",
    image: "https://placehold.co/800x600/png?text=McFarlane+Toys",
    slug: "mcfarlane-toys",
  },
  {
    id: "hottoys",
    title: "Hot Toys",
    description: "Coleccionables premium a escala 1/6.",
    image: "https://placehold.co/800x600/png?text=Hot+Toys",
    slug: "hot-toys",
  },
];

export default function MarcasPage() {
  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-primary">Marcas</h1>
        <MarcasGrid marcas={MARCAS} onSelect={(marca) => console.log(marca)} />
      </div>
    </main>
  );
}
