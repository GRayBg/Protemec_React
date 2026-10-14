import { useRef, useState } from 'react'

export default function FormularioCompra({
  idEditando,
  proveedor, setProveedor,
  costo, setCosto,
  categoria, setCategoria,
  producto, setProducto,
  proyecto, setProyecto,
  proyectoIdExterno, setProyectoIdExterno,
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
  proveedoresUnicos = [],
  categoriasUnicas = [],
  productosUnicos = [],
  materialesUnicos = [],
  proyectosUnicos = [],
  proyectoIdsUnicos = []
}) {
  const fileInputRef = useRef(null)
  const [nombreArchivo, setNombreArchivo] = useState('')
  const costoConIva = costo ? (parseFloat(costo) * 1.16).toFixed(2) : '0.00'

  const manejarCambioArchivo = (e) => {
    const file = e.target.files?.[0] || null
    setArchivoSeleccionado(file)
    setNombreArchivo(file ? file.name : '')
  }

  return (
    <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* SECCIÓN 1: CLASIFICACIÓN Y PROYECTO */}
      <div style={estilos.gridSeccion}>
        <div>
          <label className="pro-label">Estatus de Operación</label>
          <select value={estatus} onChange={(e) => setEstatus(e.target.value)} className="pro-select">
            <option value="Comprado">🟢 Comprado (Firme)</option>
            <option value="Cotizado">🟡 Cotizado (Presupuesto)</option>
          </select>
        </div>

        <div>
          <label className="pro-label">Fecha de Operación</label>
          <input
            type="date"
            value={fechaCompra}
            onChange={(e) => setFechaCompra(e.target.value)}
            className="pro-input"
          />
        </div>

        <div>
          <label className="pro-label">Folio / Proyecto ID Externo</label>
          <input
            type="text"
            list="lista-proyecto-ids"
            autoComplete="off"
            value={proyectoIdExterno}
            onChange={(e) => setProyectoIdExterno(e.target.value)}
            placeholder="Ej. CDP002779-2"
            className="pro-input pro-mono"
          />
          <datalist id="lista-proyecto-ids">
            {proyectoIdsUnicos.map((idExt, idx) => (
              <option key={idx} value={idExt} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="pro-label">Nombre del Proyecto</label>
          <input
            type="text"
            list="lista-proyectos"
            autoComplete="off"
            value={proyecto}
            onChange={(e) => setProyecto(e.target.value)}
            placeholder="Asignar a proyecto..."
            className="pro-input"
          />
          <datalist id="lista-proyectos">
            {proyectosUnicos.map((p, idx) => (
              <option key={idx} value={p} />
            ))}
          </datalist>
        </div>
      </div>

      {/* SECCIÓN 2: PROVEEDOR Y ESPECIFICACIÓN TÉCNICA */}
      <div style={estilos.gridSeccion}>
        <div style={{ gridColumn: 'span 2' }}>
          <label className="pro-label">Proveedor / Razón Social *</label>
          <input
            type="text"
            list="lista-proveedores"
            autoComplete="off"
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
            required
            placeholder="Escribe o selecciona un proveedor..."
            className="pro-input"
          />
          <datalist id="lista-proveedores">
            {proveedoresUnicos.map((p, idx) => (
              <option key={idx} value={p} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="pro-label">Categoría *</label>
          <input
            type="text"
            list="lista-categorias"
            autoComplete="off"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            required
            placeholder="Ej. Maquinado, Tornillería..."
            className="pro-input"
          />
          <datalist id="lista-categorias">
            {categoriasUnicas.map((c, idx) => (
              <option key={idx} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="pro-label">Material / Aleación</label>
          <input
            type="text"
            list="lista-materiales"
            autoComplete="off"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            placeholder="Ej. Acero D2, Aluminio 6061..."
            className="pro-input"
          />
          <datalist id="lista-materiales">
            {materialesUnicos.map((m, idx) => (
              <option key={idx} value={m} />
            ))}
          </datalist>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label className="pro-label">Descripción del Producto o Servicio *</label>
          <input
            type="text"
            list="lista-productos"
            autoComplete="off"
            value={producto}
            onChange={(e) => setProducto(e.target.value)}
            required
            placeholder="Descripción técnica del componente o servicio..."
            className="pro-input"
          />
          <datalist id="lista-productos">
            {productosUnicos.map((p, idx) => (
              <option key={idx} value={p} />
            ))}
          </datalist>
        </div>
      </div>

      {/* SECCIÓN 3: DESGLOSE FINANCIERO AUTOMÁTICO */}
      <div style={estilos.panelFinanciero}>
        <div>
          <label className="pro-label">Cantidad</label>
          <input
            type="number"
            step="any"
            min="0.01"
            value={cantidad}
            onChange={(e) => {
              const cant = e.target.value
              setCantidad(cant)
              if (precioUnitario && cant) {
                setCosto((parseFloat(precioUnitario) * parseFloat(cant)).toFixed(2))
              }
            }}
            className="pro-input pro-mono"
          />
        </div>

        <div>
          <label className="pro-label">Precio Unitario ($ MXN)</label>
          <input
            type="number"
            step="0.01"
            value={precioUnitario}
            onChange={(e) => {
              const pu = e.target.value
              setPrecioUnitario(pu)
              if (cantidad && pu) {
                setCosto((parseFloat(pu) * parseFloat(cantidad)).toFixed(2))
              }
            }}
            placeholder="0.00"
            className="pro-input pro-mono"
          />
        </div>

        <div>
          <label className="pro-label">Subtotal s/ IVA ($) *</label>
          <input
            type="number"
            step="0.01"
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
            required
            placeholder="0.00"
            className="pro-input pro-mono"
            style={{ fontWeight: 700 }}
          />
        </div>

        <div>
          <label className="pro-label" style={{ color: '#059669' }}>Total Neto c/ IVA (16%)</label>
          <div style={estilos.displayTotalIva} className="pro-mono">
            ${Number(costoConIva).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: NOTAS Y EVIDENCIA EN AZURE BLOB STORAGE */}
      <div style={estilos.gridSeccion}>
        <div style={{ gridColumn: 'span 2' }}>
          <label className="pro-label">Notas / Observaciones</label>
          <input
            type="text"
            autoComplete="off"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Tiempo de entrega, condiciones de pago, número de factura..."
            className="pro-input"
          />
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <label className="pro-label">
            {idEditando ? 'Reemplazar Cotización / Factura (PDF o Imagen)' : 'Adjuntar Cotización / Factura (Azure Blob)'}
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={estilos.dropzoneArchivo}
          >
            <span>📎</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nombreArchivo || 'Seleccionar archivo PDF, PNG o JPG...'}
            </span>
            <span style={estilos.badgeExaminar}>Examinar</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={manejarCambioArchivo}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* PIE DE ACCIONES DEL FORMULARIO */}
      <div style={estilos.footerAcciones}>
        {idEditando && (
          <button
            type="button"
            onClick={manejarCancelarRegistro}
            className="pro-btn pro-btn-danger"
            style={{ marginRight: 'auto' }}
          >
            🚫 Cancelar Registro
          </button>
        )}

        <button type="button" onClick={cancelarEdicion} className="pro-btn pro-btn-secondary">
          Cerrar
        </button>

        <button
          type="submit"
          disabled={guardando}
          className={`pro-btn ${idEditando ? 'pro-btn-primary' : 'pro-btn-success'}`}
        >
          {guardando
            ? 'Sincronizando con Azure...'
            : idEditando
              ? '💾 Guardar Cambios'
              : '✓ Registrar Operación'}
        </button>
      </div>
    </form>
  )
}

const estilos = {
  gridSeccion: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px'
  },
  panelFinanciero: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '14px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid rgba(0, 0, 0, 0.06)'
  },
  displayTotalIva: {
    padding: '9px 12px',
    borderRadius: '8px',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#065f46',
    fontWeight: 800,
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center'
  },
  dropzoneArchivo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px dashed #cbd5e1',
    backgroundColor: '#f8fafc',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#515154'
  },
  badgeExaminar: {
    backgroundColor: '#ffffff',
    border: '1px solid #d2d2d7',
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: 600,
    color: '#1d1d1f'
  },
  footerAcciones: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '10px',
    paddingTop: '12px',
    borderTop: '1px solid var(--border-light)'
  }
}