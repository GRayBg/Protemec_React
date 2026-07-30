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
  fechaCompra, setFechaCompra,
  estatus, setEstatus,
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
        {idEditando ? `✏️ Modificar Registro #${idEditando}` : '➕ Registrar Nueva Compra / Cotización'}
      </h3>
      <div style={estilos.grupoInputs}>
        
        {/* Estatus */}
        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={estilos.label}>Estatus:</label>
          <select value={estatus} onChange={e => setEstatus(e.target.value)} style={estilos.input}>
            <option value="Comprado">🟢 Comprado</option>
            <option value="Cotizado">🟡 Cotizado</option>
          </select>
        </div>

        {/* Proveedor */}
        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={estilos.label}>Proveedor:</label>
          <input type="text" list="lista-proveedores" value={proveedor} onChange={e => setProveedor(e.target.value)} required style={estilos.input} />
          <datalist id="lista-proveedores">{proveedoresUnicos.map((p, idx) => <option key={idx} value={p} />)}</datalist>
        </div>

        {/* Proyecto */}
        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={estilos.label}>Proyecto:</label>
          <input type="text" list="lista-proyectos" value={proyecto} onChange={e => setProyecto(e.target.value)} style={estilos.input} />
          <datalist id="lista-proyectos">{proyectosUnicos.map((p, idx) => <option key={idx} value={p} />)}</datalist>
        </div>

        {/* Categoría */}
        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={estilos.label}>Categoría:</label>
          <input type="text" list="lista-categorias" value={categoria} onChange={e => setCategoria(e.target.value)} required style={estilos.input} />
          <datalist id="lista-categorias">{categoriasUnicas.map((c, idx) => <option key={idx} value={c} />)}</datalist>
        </div>

        {/* Producto */}
        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={estilos.label}>Producto:</label>
          <input type="text" list="lista-productos" value={producto} onChange={e => setProducto(e.target.value)} required style={estilos.input} />
          <datalist id="lista-productos">{productosUnicos.map((p, idx) => <option key={idx} value={p} />)}</datalist>
        </div>

        {/* Cantidad */}
        <div style={{ flex: '1', minWidth: '100px' }}>
          <label style={estilos.label}>Cantidad:</label>
          <input type="number" value={cantidad} onChange={e => {
            const cant = e.target.value
            setCantidad(cant)
            if (precioUnitario && cant) setCosto((parseFloat(precioUnitario) * parseFloat(cant)).toFixed(2))
          }} style={estilos.input} />
        </div>

        {/* Precio Unitario */}
        <div style={{ flex: '1', minWidth: '120px' }}>
          <label style={estilos.label}>P. Unitario ($):</label>
          <input type="number" step="0.01" value={precioUnitario} onChange={e => {
            const pu = e.target.value
            setPrecioUnitario(pu)
            if (cantidad && pu) setCosto((parseFloat(pu) * parseFloat(cantidad)).toFixed(2))
          }} style={estilos.input} />
        </div>

        {/* Costo Total */}
        <div style={{ flex: '1', minWidth: '120px' }}>
          <label style={estilos.label}>Costo Total ($):</label>
          <input type="number" step="0.01" value={costo} onChange={e => setCosto(e.target.value)} required style={estilos.input} />
        </div>

        {/* Archivo */}
        <div style={{ flex: '1', minWidth: '200px' }}>
          <label style={estilos.label}>{idEditando ? 'Reemplazar archivo:' : 'Adjuntar Archivo:'}</label>
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={e => setArchivoSeleccionado(e.target.files[0])} style={estilos.input} />
        </div>

        {/* Fecha Compra */}
        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={estilos.label}>Fecha:</label>
          <input type="date" value={fechaCompra} onChange={e => setFechaCompra(e.target.value)} style={estilos.input} />
        </div>

        <button type="submit" disabled={guardando} style={idEditando ? estilos.botonEditar : estilos.botonGuardar}>
          {guardando ? 'Guardando...' : idEditando ? '💾 Actualizar' : '💾 Guardar'}
        </button>

        {idEditando && (
          <button type="button" onClick={cancelarEdicion} style={estilos.botonCancelar}>❌ Cancelar</button>
        )}
      </div>
    </form>
  )
}

const estilos = {
  formulario: { backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e3e6f0' },
  grupoInputs: { display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' },
  label: { fontSize: '11px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '3px' },
  input: { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', fontSize: '13px', boxSizing: 'border-box' },
  botonGuardar: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', height: '36px' },
  botonEditar: { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', height: '36px' },
  botonCancelar: { backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', height: '36px' }
}