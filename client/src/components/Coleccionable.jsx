const Coleccionable = ({id, descripcion, nombre, precio, linea_id})=>{
    return(
        <>
        <p>ID:{id}</p>        
        <h1>{nombre}</h1>        
        <p>{descripcion}</p>
        <p>{precio}</p>
        <p>{linea_id}</p>
        </>
    )
}
export default Coleccionable