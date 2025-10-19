const PostCard = ({id, title, body, userId})=>{
    return(
        <>
        <p>{id}</p>
        <h3>{title}</h3>
        <h2>{body}</h2>
        <h1>{userId}</h1>
        </>
    )
}
export default PostCard