import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios"

export const fetchDestacados = createAsyncThunk("colDestacados/fetchDestacados", async (colId, { rejectWithValue }) => {

    if(!colId) return rejectWithValue("Id del coleccionable invalido")
    
    const URLColeccionable = `http://localhost:4002/coleccionable/${colId} `//"http://localhost:4002/coleccionable/${colId}"
    const URLImagen = `http://localhost:4002/coleccionable/${colId}/imagenes/0`

    const headers = {
        'Content-Type': 'application/json'
    };

    /*Axios devuelve un JSON con este formato:
    {
        data: ...,
        status: ...,
        headers: ...
    }*/

    const { data } = await axios.get(URLColeccionable, { headers }) //axios devuelve JSON de una
    const { data: blobImg } = await axios.get(URLImagen, { headers, responseType: "blob" })
    const imgURL = URL.createObjectURL(blobImg);
    return { colId, data, imgURL }
})

const colDestacadosSlice = createSlice({
    name: "destacados",
    initialState: {
        coleccionables: {},
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDestacados.pending, (state, action) => { //Pending no recibe payload
                state.coleccionables[action.meta.arg] = { //action.meta.arg = colId. Este es el mismo id que el que retorna por payload, pero lo saca del parametro que recibe el thunk en vez
                    loading: true,
                    error: null
                }
            })
            .addCase(fetchDestacados.fulfilled, (state, action) => {
                state.coleccionables[action.payload.colId] = {
                    coleccionable: action.payload.data,
                    imagen: action.payload.imgURL,
                    loading: false,
                    error: null
                }
                //state.coleccionables = [... state.coleccionables, action.payload.data] Para arreglos
                //state.imagenes = [...state.imagenes, action.payload.imgURL]                
            })
            .addCase(fetchDestacados.rejected, (state, action) => { //Rejected no recibe payload
                state.coleccionables[action.meta.arg] = {
                    loading: false,
                    error: action.payload || action.error.message
                }
            })
    },
});

export default colDestacadosSlice.reducer;