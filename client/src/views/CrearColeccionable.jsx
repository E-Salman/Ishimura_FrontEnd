import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  createColeccionable,
  uploadColeccionableImagesThunk,
  fetchMarcas,
  fetchLineasByMarca,
  selectMarcas,
  selectLineasByMarca,
} from "../redux/adminSlice";

export default function CrearColeccionable() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, role } = useSelector((state) => state.login)
  const [marcas, setMarcas] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [marcaId, setMarcaId] = useState("");
  const [lineaId, setLineaId] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [okMsg, setOkMsg] = useState(null);
  const [visibilidad, setVisibilidad] = useState(true);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fileNotice, setFileNotice] = useState("");

  const marcasStore = useSelector(selectMarcas);
  const lineasStore = useSelector((state) => selectLineasByMarca(state, marcaId || ""));

  useEffect(() => {
    dispatch(fetchMarcas());
  }, [dispatch]);

  useEffect(() => {
    setMarcas(Array.isArray(marcasStore) ? marcasStore : []);
  }, [marcasStore]);

  useEffect(() => {
    setLineas(Array.isArray(lineasStore) ? lineasStore : []);
  }, [lineasStore]);

  useEffect(() => {
    setLineas([]);
    setLineaId("");
    if (!marcaId) return;
    dispatch(fetchLineasByMarca({ marcaId }));
  }, [dispatch, marcaId]);

  function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    setSubmitting(true);
    const payload = {
      nombre: nombre?.trim(),
      descripcion: descripcion?.trim(),
      precio: precio === "" ? null : Number(precio),
      linea: lineaId ? Number(lineaId) : null,
      imagenes: [],
      visibilidad,
    };
    let createdId = null;
    dispatch(createColeccionable({ data: payload, token }))
      .unwrap()
      .then((created) => {
        createdId = created?.id ?? created?.coleccionableId ?? created?.coleccionableID ?? null;
        if (createdId && files.length > 0) {
          setUploading(true);
          return dispatch(uploadColeccionableImagesThunk({ coleccionableId: createdId, files, token }))
            .unwrap()
            .finally(() => setUploading(false));
        }
        return null;
      })
      .then(() => {
        setOkMsg(`Creado con exito${createdId ? ` (ID: ${createdId})` : ""}${files.length ? " con imagenes" : ""}`);
        setNombre("");
        setDescripcion("");
        setPrecio("");
        setMarcaId("");
        setLineaId("");
        setVisibilidad(true);
        setFiles([]);
        setPreviews((old) => {
          old.forEach((u) => { URL.revokeObjectURL(u); });
          return [];
        });
      })
      .catch((err) => {
        setError(err?.message || String(err));
      })
      .finally(() => {
        setSubmitting(false);
      });
  }

  if (!(role === 'ADMIN')) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-black text-primary">No autorizado</h1>
        <p className="mt-2 text-white/70">Necesitas permisos de administrador para crear coleccionables.</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black text-primary">Crear Coleccionable</h1>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {okMsg && <p className="mt-4 text-sm text-emerald-400">{okMsg}</p>}

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-white/80">Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required className="mt-1 w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80">Descripcion</label>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80">Precio</label>
          <input type="number" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} required className="mt-1 w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none" />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-white/80">
          <input
            type="checkbox"
            checked={visibilidad}
            onChange={(e) => setVisibilidad(e.target.checked)}
            className="h-4 w-4"
          />
          Visible para usuarios
        </label>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-white/80">Marca</label>
            <select value={marcaId} onChange={(e) => setMarcaId(e.target.value)} className="w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none">
              <option value="">Seleccionar marca</option>
              {marcas.map((m) => (
                <option key={m.id ?? m.marcaId} value={m.id ?? m.marcaId}>{m.nombre ?? m.name ?? m.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white/80">Linea</label>
            <select value={lineaId} onChange={(e) => setLineaId(e.target.value)} disabled={!marcaId} className="w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white disabled:opacity-50 focus:border-primary/50 focus:outline-none">
              <option value="">Seleccionar</option>
              {lineas.map((l) => (
                <option key={l.id ?? l.lineaId} value={l.id ?? l.lineaId}>{l.nombre ?? l.name ?? l.titulo}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-white/80">Imagenes</label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            multiple
            onChange={(e) => {
              const list = Array.from(e.target.files || []);
              const allowed = ["image/jpeg", "image/png", "image/jpg"];
              const accepted = list.filter((f) => allowed.includes(f.type) || /\.(jpe?g|png)$/i.test(f.name));
              const rejected = list.length - accepted.length;
              const nextPrevs = accepted.map((f) => URL.createObjectURL(f));
              setPreviews((prev) => { prev.forEach((u) => URL.revokeObjectURL(u)); return nextPrevs; });
              setFiles(accepted);
              setFileNotice(rejected > 0 ? `Se ignoraron ${rejected} archivo(s) por formato no soportado (solo JPG/PNG).` : "");
            }}
            className="w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-black hover:file:bg-primary/90 focus:border-primary/50 focus:outline-none"
          />
          {fileNotice && <p className="mt-2 text-xs text-amber-300">{fileNotice}</p>}
          {previews?.length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative group">
                  <img src={src} alt={`preview-${i}`} className="w-full h-32 object-cover rounded-md border border-white/10" />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviews((prev) => {
                        const copy = [...prev];
                        const [u] = copy.splice(i, 1);
                        if (u) URL.revokeObjectURL(u);
                        return copy;
                      });
                      setFiles((prev) => prev.filter((_, idx) => idx !== i));
                    }}
                    className="absolute top-1 right-1 rounded bg-black/60 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}
          {uploading && (
            <p className="mt-2 text-sm text-white/70">Subiendo imagenes...</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="rounded-md bg-primary px-5 py-2 text-sm font-bold text-black hover:bg-primary/90 disabled:opacity-50">
            {submitting ? 'Creando...' : 'Crear'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="rounded-md border border-white/10 px-5 py-2 text-sm font-semibold text-black dark:text-black hover:bg-white/5">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
