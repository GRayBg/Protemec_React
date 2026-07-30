import { useRef } from 'react'

export default function FormularioCompra({
  idEditando,
  proveedor, setProveedor,
  costo, setCosto,
  categoria, setCategoria,
  producto, setProducto,
  proyecto, setProyecto,
  precioUnitario, setPrecioUnitario,
  cantidad, setCantidad,
  urlSaaS,
  fechaCompra, setFechaCompra,
  setArchivoSeleccionado,
  guardando,
  manejarEnvio,
  cancelarEdicion,
  proveedoresUnicos,
  categoriasUnicas,
  productosUnicos,
  proyectosUnicos
}) {
  const fileInputRef = useRef(null)

  return (
    <form onSubmit={manejarEnvio} style={estilos.formulario}>
      <h3 style={{ marginTop: 0, marginBottom: '15px' }}>
        {idEditando ? `✏️ Modificar Registro #${idEditando}` : '➕ Registrar Nueva Compra'}
      </h3>
      <div style={estilos.grupoInputs}>
        
        {/* Proveedor */}
        <input 
          type="text" 
          list="lista-proveedores"
          placeholder="Proveedor" 
          value={proveedor} 
          onChange={(e) => setProveedor(e.target.value)}
          required
          style={estilos.input}
        />
        <datalist id="lista-proveedores">
          {proveedoresUnicos.map((p, idx) => <option key={idx} value={p} />)}
        </datalist>

        {/* Proyecto */}
        <input 
          type="text" 
          list="lista-proyectos"
          placeholder="Proyecto" 
          value={proyecto} 
          onChange={(e) => setProyecto(e.target.value)}
          style={estilos.input}
        />
        <datalist id="lista-proyectos">
          {proyectosUnicos.map((p, idx) => <option key={idx} value={p} />)}
        </datalist>

        {/* Categoría */}
        <input 
          type="text" 
          list="lista-categorias"
          placeholder="Categoría" 
          value={categoria} 
          onChange={(e) => setCategoria(e.target.value)}
          required
          style={estilos.input}
        />
        <datalist id="lista-categorias">
          {categoriasUnicas.map((c, idx) => <option key={idx} value={c} />)}
        </datalist>

        {/* Producto */}
        <input 
          type="text" 
          list="lista-productos"
          placeholder="Producto" 
          value={producto} 
          onChange={(e) => setProducto(e.target.value)}
          required
          style={estilos.input}
        />
        <datalist id="lista-productos">
          {productosUnicos.map((p, idx) => <option key={idx} value={p} />)}
        </datalist>

        {/* Cantidad */}
        <input 
          type="number" 
          placeholder="Cantidad" 
          value={cantidad} 
          onChange={(e) => {
            const cant = e.target.value
            setCantidad(cant)
            if (precioUnitario && cant) setCosto((parseFloat(precioUnitario) * parseFloat(cant)).toFixed(2))
          }}
          style={estilos.input}
        />

        {/* Precio Unitario */}
        <input 
          type="number" 
          step="0.01" 
          placeholder="Precio Unitario ($)" 
          value={precioUnitario} 
          onChange={(e) => {
            const pu = e.target.value
            setPrecioUnitario(pu)
            if (cantidad && pu) setCosto((parseFloat(pu) * parseFloat(cantidad)).toFixed(2))
          }}
          style={estilos.input}
        />

        {/* Costo Total */}
        <input 
          type="number" 
          step="0.01" 
          placeholder="Costo Total ($)" 
          value={costo} 
          onChange={(e) => setCosto(e.target.value)}
          required
          style={estilos.input}
        />
        
        {/* Archivo */}
        <div style={{ flex: '1', minWidth: '220px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#ccc' }}>
            {idEditando ? 'Reemplazar archivo (Opcional):' : 'Adjuntar Archivo / Factura:'}
          </label>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*,application/pdf"
            onChange={(e) => setArchivoSeleccionado(e.target.files[0])}
            style={{ ...estilos.input, width: '100%' }}
          />
        </div>

        {/* Fecha Compra */}
        <input 
          type="date" 
          value={fechaCompra} 
          onChange={(e) => setFechaCompra(e.target.value)}
          title="Fecha de la Compra"
          style={estilos.input}
        />

        <button type="submit" disabled={guardando} style={idEditando ? estilos.botonEditar : estilos.botonGuardar}>
          {guardando ? 'Guardando...' : idEditando ? '💾 Actualizar' : '💾 Guardar Registro'}
        </button>

        {idEditando && (
          <button type="button" onClick={cancelarEdicion} style={estilos.botonCancelar}>
            ❌ Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

const estilos = {
  formulario: { 
    backgroundColor: '#f8f9fa', 
    color: '#333', 
    padding: '20px', 
    borderRadius: '8px', 
    marginBottom: '30px', 
    border: '1px solid #e3e6f0' 
  },
  grupoInputs: { 
    display: 'flex', 
    gap: '10px', 
    flexWrap: 'wrap', 
    alignItems: 'flex-end' 
  },
  input: { 
    flex: '1', 
    minWidth: '140px', 
    padding: '10px', 
    borderRadius: '4px', 
    border: '1px solid #ccc', 
    backgroundColor: '#fff', 
    color: '#333', 
    fontSize: '14px', 
    boxSizing: 'border-box' 
  },
  botonGuardar: { 
    backgroundColor: '#28a745', 
    color: 'white', 
    border: 'none', 
    padding: '10px 20px', 
    borderRadius: '4px', 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    height: '40px' 
  },
  botonEditar: { 
    backgroundColor: '#007bff', 
    color: 'white', 
    border: 'none', 
    padding: '10px 20px', 
    borderRadius: '4px', 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    height: '40px' 
  },
  botonCancelar: { 
    backgroundColor: '#6c757d', 
    color: 'white', 
    border: 'none', 
    padding: '10px 15px', 
    borderRadius: '4px', 
    cursor: 'pointer', 
    height: '40px' 
  }
}