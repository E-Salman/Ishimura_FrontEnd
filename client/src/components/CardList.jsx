import { use, useEffect, useState } from "react"
import PostCard from "./PostCard"
import { useDispatch, useSelector } from 'react-redux'

const CardList = () => {
    const dispatch = useDispatch()
    const { items, error, loading } = useSelector((state) => state.posts)

    useEffect(()=>{
        dispatch(fetchPosts())
    }, [dispatch])

    if (loading) return <p>Cargando Publicaciones...</p>;
    if (error) return <p>Error al cargar publicaciones: {error} </p>;

    return (
        <>
            <h1>asopdkasopdmkaspdfm</h1>
            <div>
                {
                    items.map((item) => (//Para cada post en posts, renderiza un PostCard con los datos especificados
                        <PostCard
                            key={item.id}
                            id={item.id}
                            title={item.title}
                            body={item.body}
                            userId={item.userId}
                        />
                    ))
                }
            </div>
        </>
    )
}
export default CardList