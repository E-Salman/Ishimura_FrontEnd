import { useEffect, useState } from "react"
import Coleccionable from "./Coleccionable";
import Imagen from "./Imagen";

const ColeccionableDestacado = ({ colId }) => {
    const [coleccionable, setColeccionable] = useState({})
    const [coleccionables, setColeccionables] = useState([])
    const [nombre, setNombre] = useState("")
    const [descripcion, setDescription] = useState("")
    const [precio, setPrecio] = useState(0)
    const [linea_id, setLinea_id] = useState()
    const [token, setToken] = useState("")
    const [imagen, setImagen] = useState(null)
    const URLColeccionable = `http://localhost:4002/coleccionable/${colId}`//"http://localhost:4002/coleccionable/${colId}"
    const URLImagen = `http://localhost:4002/coleccionable/${colId}/imagenes/0`

    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res1 = await fetch(URLColeccionable, options);
                const coleccionableData = await res1.json();
                setColeccionable(coleccionableData);

                const res2 = await fetch(URLImagen);
                const blob = await res2.blob();
                const imagenBlob = URL.createObjectURL(blob);
                setImagen(imagenBlob);
            }
            catch (err) {
                console.error("Error al obtener los datos", err)
            }
        };
        fetchData();
        return () => {
            if (imagen) URL.revokeObjectURL(imagen);
        };
    }, [colId]); //Se vuelve a correr este useEffect cada vez que colId cambie

    /*
        useEffect(() => {
            fetch(URL, options)        
            .then((response) => {
                return response.json()
            })        
            .then((data) => {
                setColeccionable(data)
            })
            .catch((error)=>{
                console.error("Error al obtener los datos")
            })        
        }, []) //Con [] vacio, corre una sola vez*/

    return (
        <div style={{ textAlign: 'left' }}>
            {
                imagen ? (
                    <img
                        src={imagen}
                        alt="Coleccionable"
                        style={{
                            width: 200,
                            height: 200,
                            objectFit: "cover",
                            borderRadius: 8,
                        }}
                    />
                ) : (
                    <p>Loading image...</p>
                )}
            <Coleccionable
                key={coleccionable.id}
                id={coleccionable.id}
                nombre={coleccionable.nombre}
                descripcion={coleccionable.descripcion}
                precio={coleccionable.precio}
                linea_id={coleccionable.linea_id}
            />
        </div>
    )

    //Mover a un crear coleccionable
    /*const options = {
        method: 'POST',
        header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({nombre, description, precio, linea_id})
    }

    useEffect(()=>{
        fetch(URL, options)
        .then((response) => response.json)
        .then((data) => {
            setColeccionables([...coleccionables, {data}])
        })
        .catch((error)=>{
            console.error("Error al obtener los datos")
        })
    }, [coleccionables])*/
}
export default ColeccionableDestacado