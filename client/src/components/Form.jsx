import { useState } from "react"
import Todo from './Todo'//probar borrar
const Form = () => {
    /*const [todos, setTodos] = useState([
        {todo: 'Todo 1'},
        {todo: 'Todo 2'},
        {todo: 'Todo 3'}
    ])*/
    const [todo, setTodo] = useState("")
    const [todos, setTodos] = useState([]);

    const handleChange = (e) => setTodo(e.target.value)

    const handleClick = ()=>{
        if(todo.trim()===""){
            alert("El campo no puede estar vacio");
            return;
        }
        setTodos([ ...todos,{ todo }]);
        return;
    };

    return (
        <>
            <form onSubmit={(e)=> e.preventDefault()}>
                <label>Agregar tarea</label>
                <input type="text" name="todo" onChange={handleChange}/>
                <button onClick={handleClick}>Agregar</button>

            </form>
            {todos.map((value, index) => (
                <Todo todo={value.todo} key={index}/>
            ))}
            <div>Hola, soy un component funcional</div>
        </>
    )
};
export default Form