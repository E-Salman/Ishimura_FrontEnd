import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "./axiosClient";

export const fetchDestacados = createAsyncThunk("colDestacados/fetchDestacados", async (colId, { rejectWithValue }) => {
    if (!colId) return rejectWithValue("Id del coleccionable invalido");

    const asText = async (val) => {
        if (!val) return "";
        if (typeof val === "string") return val;
        if (typeof val === "object" && typeof val.message === "string") return val.message;
        return Promise.resolve()
            .then(() => JSON.stringify(val))
            .catch(() => String(val));
    };

    const URLColeccionable = `http://localhost:4002/coleccionable/${colId}`;
    const URLImagen = `http://localhost:4002/coleccionable/${colId}/imagenes/0`;

    const headers = {
        'Content-Type': 'application/json'
    };

    return api
        .get(URLColeccionable, { headers, validateStatus: () => true })
        .then(async (res) => {
            if (res.status !== 200) {
                const msg = await asText(res?.data);
                return rejectWithValue(msg || `HTTP ${res.status}`);
            }

            let imgURL = null;

            await api
                .get(URLImagen, { headers, responseType: "blob", validateStatus: (s) => s === 200 || s === 404 })
                .then((imgRes) => {
                    if (imgRes.status === 200) {
                        imgURL = URL.createObjectURL(imgRes.data);
                    }
                })
                .catch(() => {
                    imgURL = null;
                });

            return { colId, data: res.data, imgURL };
        })
        .catch(async (err) => {
            const msg = await asText(err?.response?.data);
            return rejectWithValue(msg || err?.message || "Error cargando destacados");
        });
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
                    error: typeof action.payload === "string" ? action.payload : action.error.message
                }
            })
    },
});

export default colDestacadosSlice.reducer;
