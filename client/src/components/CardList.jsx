import { useEffect, useState } from "react"
import PostCard from "./PostCard"

const CardList = () => {
    const [posts, setPosts] = useState([]) //{id: body: title: userId:}
    const URL = "https://jsonplaceholder.typicode.com/posts"//"https://jsonplaceholder.typicode.com/posts/${postId}"

    useEffect(() => {
        fetch(URL)
            .then((response) => response.json())
            .then((data) => {
                setPosts(data) //si sale bien, se guardan los datos de la respuesta en el useState
            })
            .catch((error) => {
                console.error("Error al obtener los datos")
            })
    }, [])

    return (
        <>
            <h1>asopdkasopdmkaspdfm</h1>
            <div>
                {
                    posts.map((post) => (//Para cada post en posts, renderiza un PostCard con los datos especificados
                        <PostCard
                            key={post.id}
                            id={post.id}
                            title={post.title}
                            body={post.body}
                            userId={post.userId}
                        />
                    ))
                }
            </div>
        </>
    )
}
export default CardList