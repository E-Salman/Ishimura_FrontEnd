import { useEffect, useState } from "react"
import Coleccionable from "./Coleccionable";
import { fetchDestacados } from "../redux/colDestacadosSlice";
import { useDispatch, useSelector } from "react-redux";

const ColeccionableDestacado = ({ colId }) => {
    const { coleccionables } = useSelector((state) => state.destacados)
    if (!coleccionables || !coleccionables[colId]) return <p>Cargando...</p>
    const { loading, error } = coleccionables[colId]

    if(loading) return <p>Cargando!</p>
    if(error) return <p>error: {error}</p>

    const {coleccionable, imagen } = coleccionables[colId]

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
}
export default ColeccionableDestacado