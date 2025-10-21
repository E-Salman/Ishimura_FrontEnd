const Coleccionable = ({id, descripcion, nombre, precio, linea_id})=>{
    return(
        <>   
        <h3 className="font-bold text-white">{nombre}</h3>        
        <p className="text-sm text-white/60">{descripcion}</p>
        </>
    )
}
export default Coleccionable