import { useRef } from 'react'

export default function FormularioCompra({
  idEditando,
  proveedor, setProveedor,
  costo, setCosto,
  categoria, setCategoria,
  producto, setProducto,
  proyecto, setProyecto,
  proyectoIdExterno, setProyectoIdExterno, // Nuevo estado
  precioUnitario, setPrecioUnitario,
  cantidad, setCantidad,
  fechaCompra, setFechaCompra,
  estatus, setEstatus,
  material, setMaterial,
  notas, setNotas,
  setArchivoSeleccionado,
  guardando,
  manejarEnvio,
  cancelarEdicion,
  manejarCancelarRegistro,
  proveedoresUnicos,
  categoriasUnicas,
  productosUnicos,
  proyectosUnicos
}) {
  const fileInputRef = useRef(null)
  const costoConIva = costo ? (parseFloat(costo) * 1.16).toFixed(2) : ''

  return (
    <form onSubmit={manejarEnvio} style={estilos.formulario}>
      <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#0f172a' }}>
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
          <input type="text" list="lista-proveedores" value={proveedor} onChange={e => setProveedor(e.target.value)} required placeholder="Selecciona..." style={estilos.input} />
          <datalist id="lista-proveedores">{proveedoresUnicos && proveedoresUnicos.map((p, idx) => <option key={idx} value={p} />)}</datalist>
        </div>

        {/* NUEVO: Proyecto ID */}
        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={estilos.label}>Proyecto ID:</label>
          <input type="text" value={proyectoIdExterno} onChange={e => setProyectoIdExterno(e.target.value)} placeholder="Ej. CDP002779-2" style={estilos.input} />
        </div>

        {/* Proyecto (Solo Nombre) */}
        <div style={{ flex: '1', minWidth: '180px' }}>
          <label style={estilos.label}>Proyecto (Nombre):</label>
          <input type="text" list="lista-proyectos" value={proyecto} onChange={e => setProyecto(e.target.value)} placeholder="Nombre del proyecto..." style={estilos.input} />
          <datalist id="lista-proyectos">{proyectosUnicos && proyectosUnicos.map((p, idx) => <option key={idx} value={p} />)}</datalist>
        </div>

        {/* Categoría */}
        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={estilos.label}>Categoría:</label>
          <input type="text" list="lista-categorias" value={categoria} onChange={e => setCategoria(e.target.value)} required placeholder="Selecciona..." style={estilos.input} />
          <datalist id="lista-categorias">{categoriasUnicas && categoriasUnicas.map((c, idx) => <option key={idx} value={c} />)}</datalist>
        </div>

        {/* Producto */}
        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={estilos.label}>Producto:</label>
          <input type="text" list="lista-productos" value={producto} onChange={e => setProducto(e.target.value)} required placeholder="Selecciona..." style={estilos.input} />
          <datalist id="lista-productos">{productosUnicos && productosUnicos.map((p, idx) => <option key={idx} value={p} />)}</datalist>
        </div>

        {/* Material */}
        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={estilos.label}>Material:</label>
          <input type="text" value={material} onChange={e => setMaterial(e.target.value)} placeholder="Ej. Acero..." style={estilos.input} />
        </div>

        {/* Cantidad */}
        <div style={{ flex: '1', minWidth: '90px' }}>
          <label style={estilos.label}>Cantidad:</label>
          <input type="number" value={cantidad} onChange={e => {
            const cant = e.target.value
            setCantidad(cant)
            if (precioUnitario && cant) setCosto((parseFloat(precioUnitario) * parseFloat(cant)).toFixed(2))
          }} style={estilos.input} />
        </div>

        {/* Precio Unitario */}
        <div style={{ flex: '1', minWidth: '110px' }}>
          <label style={estilos.label}>P. Unitario ($):</label>
          <input type="number" step="0.01" value={precioUnitario} onChange={e => {
            const pu = e.target.value
            setPrecioUnitario(pu)
            if (cantidad && pu) setCosto((parseFloat(pu) * parseFloat(cantidad)).toFixed(2))
          }} style={estilos.input} />
        </div>

        {/* Costo Subtotal */}
        <div style={{ flex: '1', minWidth: '110px' }}>
          <label style={estilos.label}>Subtotal ($):</label>
          <input type="number" step="0.01" value={costo} onChange={e => setCosto(e.target.value)} required style={estilos.input} />
        </div>

        {/* Costo Total con IVA */}
        <div style={{ flex: '1', minWidth: '110px' }}>
          <label style={estilos.label}>Total c/ IVA ($):</label>
          <input type="number" value={costoConIva} readOnly style={{ ...estilos.input, backgroundColor: '#f1f5f9', color: '#475569', cursor: 'not-allowed', fontWeight: 'bold' }} />
        </div>

        {/* Notas */}
        <div style={{ flex: '2', minWidth: '220px' }}>
          <label style={estilos.label}>Notas / Observaciones:</label>
          <input type="text" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas..." style={estilos.input} />
        </div>

        {/* Archivo */}
        <div style={{ flex: '1', minWidth: '180px' }}>
          <label style={estilos.label}>{idEditando ? 'Reemplazar archivo:' : 'Adjuntar Archivo:'}</label>
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={e => setArchivoSeleccionado(e.target.files[0])} style={estilos.inputArchivo} />
        </div>

        {/* Fecha Compra */}
        <div style={{ flex: '1', minWidth: '130px' }}>
          <label style={estilos.label}>Fecha:</label>
          <input type="date" value={fechaCompra} onChange={e => setFechaCompra(e.target.value)} style={estilos.input} />
        </div>

        {/* BOTONES DE ACCIÓN */}
        <button type="submit" disabled={guardando} style={idEditando ? estilos.botonEditar : estilos.botonGuardar}>
          {guardando ? 'Guardando...' : idEditando ? '💾 Actualizar' : '💾 Guardar'}
        </button>

        {idEditando && (
          <>
            <button type="button" onClick={cancelarEdicion} style={estilos.botonCancelar}>❌ Cancelar</button>
            <button type="button" onClick={manejarCancelarRegistro} style={estilos.botonEliminar}>🚫 Cancelar Registro</button>
          </>
        )}
      </div>
    </form>
  )
}

const estilos = {
  formulario: { backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
  grupoInputs: { display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' },
  label: { fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px', textTransform: 'uppercase' },
  input: { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box', color: '#1e293b' },
  inputArchivo: { width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '12px', boxSizing: 'border-box' },
  botonGuardar: { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12.5px', height: '36px' },
  botonEditar: { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12.5px', height: '36px' },
  botonCancelar: { backgroundColor: '#64748b', color: 'white', border: 'none', padding: '9px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12.5px', height: '36px' },
  botonEliminar: { backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '9px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12.5px', height: '36px' }
}