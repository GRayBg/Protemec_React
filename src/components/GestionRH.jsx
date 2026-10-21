import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'

const CATEGORIAS_DOCUMENTOS = [
    'Pase de Acceso a Planta',
    'Certificado de Curso / DC-3',
    'Revisión / Examen Médico',
    'Permiso / Incapacidad',
    'Pago / Recibo de Nómina',
    'Préstamo / Vale Personal',
    'Contrato / Identificación',
    'Fotografía de Perfil',
    'Otro Documento'
]

// Configuración dinámica de los 5 rubros de KPI según el Departamento
const KPIS_POR_AREA = {
    'Operaciones': [
        { key: 'kpi1', label: '⏰ Puntualidad y Asistencia' },
        { key: 'kpi2', label: '✨ Calidad / Cero Retrabajos' },
        { key: 'kpi3', label: '⚡ Productividad y Tiempos de Planta' },
        { key: 'kpi4', label: '🦺 Orden, Limpieza y Seguridad (5S)' },
        { key: 'kpi5', label: '🤝 Colaboración y Cuidado de Herramienta' }
    ],
    'Ingeniería': [
        { key: 'kpi1', label: '⏰ Cumplimiento de Cronograma' },
        { key: 'kpi2', label: '📐 Precisión en Planos / Modelos CAD' },
        { key: 'kpi3', label: '⚡ Velocidad de Diseño y Liberación' },
        { key: 'kpi4', label: '🗂️ Estandarización y Control Documental' },
        { key: 'kpi5', label: '🤝 Coordinación con Planta y Compras' }
    ],
    'Almacén': [
        { key: 'kpi1', label: '⏰ Puntualidad y Disponibilidad' },
        { key: 'kpi2', label: '📦 Exactitud de Inventario y Ubicaciones' },
        { key: 'kpi3', label: '⚡ Agilidad en Entrega de Material/Herramienta' },
        { key: 'kpi4', label: '🦺 Orden y Seguridad en Almacén (5S)' },
        { key: 'kpi5', label: '🤝 Control de Vale y Devoluciones' }
    ],
    'Compras': [
        { key: 'kpi1', label: '⏰ Seguimiento y Atención a Requisiciones' },
        { key: 'kpi2', label: '💰 Negociación de Precios y Ahorro' },
        { key: 'kpi3', label: '🚚 Cumplimiento de Tiempos de Entrega' },
        { key: 'kpi4', label: '📄 Orden en Facturas, OC y Expedientes' },
        { key: 'kpi5', label: '🤝 Comunicación con Proveedores y Planta' }
    ],
    'Recursos Humanos': [
        { key: 'kpi1', label: '⏰ Asistencia y Atención al Personal' },
        { key: 'kpi2', label: '📂 Expedientes y Pases de Planta al Día' },
        { key: 'kpi3', label: '⚡ Tiempo de Cobertura y Trámites' },
        { key: 'kpi4', label: '🦺 Seguimiento a Seguridad y Normativa' },
        { key: 'kpi5', label: '🤝 Clima Laboral y Comunicación' }
    ],
    'Dirección': [
        { key: 'kpi1', label: '⏰ Cumplimiento de Objetivos Estratégicos' },
        { key: 'kpi2', label: '📈 Rentabilidad y Control Operativo' },
        { key: 'kpi3', label: '⚡ Eficiencia Global de Proyectos' },
        { key: 'kpi4', label: '🛡️ Gestión de Riesgos y Calidad' },
        { key: 'kpi5', label: '🤝 Liderazgo y Desarrollo de Equipo' }
    ]
}

const BIMESTRES = [
    { val: 'B1', label: 'Bimestre 1 (Ene - Feb)' },
    { val: 'B2', label: 'Bimestre 2 (Mar - Abr)' },
    { val: 'B3', label: 'Bimestre 3 (May - Jun)' },
    { val: 'B4', label: 'Bimestre 4 (Jul - Ago)' },
    { val: 'B5', label: 'Bimestre 5 (Sep - Oct)' },
    { val: 'B6', label: 'Bimestre 6 (Nov - Dic)' }
]

const obtenerSemanaActualISO = () => {
    const hoy = new Date()
    const d = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export default function GestionRH({
    personalRH = [],
    evaluacionesKPI = [],
    API_URL,
    recargarDatos,
    mostrarToast,
    puedeEditar = true
}) {
    const [subVista, setSubVista] = useState('directorio')
    const [filtroEstatus, setFiltroEstatus] = useState('activos')
    const [busqueda, setBusqueda] = useState('')
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null)

    // Modal de Alta / Edición de Personal
    const [modalEmpleado, setModalEmpleado] = useState(false)
    const [editandoId, setEditandoId] = useState(null)
    const [nombreCompleto, setNombreCompleto] = useState('')
    const [telefono, setTelefono] = useState('')
    const [departamento, setDepartamento] = useState('Operaciones')
    const [puesto, setPuesto] = useState('')
    const [fechaInicio, setFechaInicio] = useState(() => new Date().toISOString().split('T')[0])
    const [fechaNacimiento, setFechaNacimiento] = useState('')
    const [activo, setActivo] = useState(true)
    const [aplicaKPI, setAplicaKPI] = useState(true)
    const [frecuenciaKpiPref, setFrecuenciaKpiPref] = useState('MENSUAL')
    const [fechaSalida, setFechaSalida] = useState('')
    const [motivoSalida, setMotivoSalida] = useState('')
    const [fotoUrlActual, setFotoUrlActual] = useState('')
    const [archivoFoto, setArchivoFoto] = useState(null)
    const [guardando, setGuardando] = useState(false)

    // Modal de Expediente Digital
    const [empleadoExpediente, setEmpleadoExpediente] = useState(null)
    const [documentosEmpleado, setDocumentosEmpleado] = useState([])
    const [cargandoDocs, setCargandoDocs] = useState(false)
    const [mostrarFormDoc, setMostrarFormDoc] = useState(false)
    const [filtroTipoDoc, setFiltroTipoDoc] = useState('TODOS')
    const [mostrarArchivados, setMostrarArchivados] = useState(false)
    const [tituloDoc, setTituloDoc] = useState('')
    const [tipoDoc, setTipoDoc] = useState('Pase de Acceso a Planta')
    const [fechaDoc, setFechaDoc] = useState(() => new Date().toISOString().split('T')[0])
    const [fechaVencimientoDoc, setFechaVencimientoDoc] = useState('')
    const [notasDoc, setNotasDoc] = useState('')
    const [archivoDoc, setArchivoDoc] = useState(null)
    const [subiendoDoc, setSubiendoDoc] = useState(false)

    // Visor Centrado de Azure Blob Storage
    const [visorDocumento, setVisorDocumento] = useState(null)

    // Estado de Evaluación y Edición de KPIs
    const [editandoKpiId, setEditandoKpiId] = useState(null)
    const [empKpiId, setEmpKpiId] = useState('')
    const [soloElegiblesKPI, setSoloElegiblesKPI] = useState(true)
    const [tipoPeriodoKpi, setTipoPeriodoKpi] = useState('MENSUAL') // 'SEMANAL' | 'MENSUAL' | 'BIMESTRAL'
    const [periodoMes, setPeriodoMes] = useState(() => new Date().toISOString().slice(0, 7))
    const [periodoSemana, setPeriodoSemana] = useState(() => obtenerSemanaActualISO())
    const [anioBimestre, setAnioBimestre] = useState(() => String(new Date().getFullYear()))
    const [numBimestre, setNumBimestre] = useState(() => `B${Math.ceil((new Date().getMonth() + 1) / 2)}`)
    const [kpiPuntualidad, setKpiPuntualidad] = useState(95)
    const [kpiCalidad, setKpiCalidad] = useState(95)
    const [kpiProductividad, setKpiProductividad] = useState(90)
    const [kpiSeguridad5S, setKpiSeguridad5S] = useState(95)
    const [kpiColaboracion, setKpiColaboracion] = useState(95)
    const [metasCumplidas, setMetasCumplidas] = useState(5)
    const [metasAsignadas, setMetasAsignadas] = useState(5)
    const [comentariosKpi, setComentariosKpi] = useState('')

    const limpiarUrlTexto = (valor) => {
        if (!valor) return ''
        if (Array.isArray(valor)) {
            const encontrado = valor.find((v) => typeof v === 'string' && v.trim() !== '')
            return encontrado ? encontrado.trim() : ''
        }
        return String(valor).trim()
    }

    const obtenerUrlSegura = (urlRaw) => {
        const limpia = limpiarUrlTexto(urlRaw)
        if (!limpia) return ''
        if (limpia.includes('/api/blob-proxy')) return limpia
        return `${API_URL}/api/blob-proxy?url=${encodeURIComponent(limpia)}`
    }

    const esArchivoImagen = (urlRaw, nombreRaw) => {
        const u = limpiarUrlTexto(urlRaw).split('?')[0].toLowerCase()
        const n = String(nombreRaw || '').toLowerCase()

        return /\.(png|jpg|jpeg|webp|gif|bmp|svg)$/.test(u) || /\.(png|jpg|jpeg|webp|gif|bmp|svg)$/.test(n)

    }

    const abrirVisorCentrado = (titulo, urlRaw, nombreArchivo = '') => {
        const urlDirecta = limpiarUrlTexto(urlRaw)
        if (!urlDirecta) {
            if (mostrarToast) mostrarToast('Este registro no tiene un archivo adjunto válido', 'alerta')
            return
        }
        setVisorDocumento({
            titulo: titulo || nombreArchivo || 'Documento de Expediente',
            urlProxy: obtenerUrlSegura(urlDirecta),
            urlDirecta,
            esImagen: esArchivoImagen(urlDirecta, nombreArchivo)
        })
    }

    // Determina si un colaborador participa en KPIs (por defecto sí, salvo que se desactive)
    const empleadoAplicaKPI = (emp) => {
        if (emp.AplicaKPI !== undefined && emp.AplicaKPI !== null) {
            return Boolean(emp.AplicaKPI)
        }
        return true
    }

    const personalFiltrado = useMemo(() => {
        return personalRH.filter((p) => {
            const esActivo = Boolean(p.Activo)
            if (filtroEstatus === 'activos' && !esActivo) return false
            if (filtroEstatus === 'inactivos' && esActivo) return false
            if (busqueda.trim()) {
                const q = busqueda.toLowerCase()
                return (
                    String(p.NombreCompleto || '').toLowerCase().includes(q) ||
                    String(p.Departamento || '').toLowerCase().includes(q) ||
                    String(p.Puesto || '').toLowerCase().includes(q)
                )
            }
            return true
        })
    }, [personalRH, filtroEstatus, busqueda])

    const personalParaSelectorKPI = useMemo(() => {
        return personalRH.filter((p) => {
            if (soloElegiblesKPI && !empleadoAplicaKPI(p)) return false
            return true
        })
    }, [personalRH, soloElegiblesKPI])

    // Rubros dinámicos según el área del colaborador seleccionado en KPIs
    const colaboradorActualKPI = useMemo(() => {
        return personalRH.find((p) => String(p.EmpleadoID) === String(empKpiId)) || empleadoSeleccionado || null
    }, [personalRH, empKpiId, empleadoSeleccionado])

    const areaActualKPI = colaboradorActualKPI?.Departamento || 'Operaciones'
    const definicionRubrosKPI = KPIS_POR_AREA[areaActualKPI] || KPIS_POR_AREA['Operaciones']

    const obtenerIniciales = (nombre) => {
        if (!nombre) return 'RH'
        const partes = nombre.trim().split(' ').filter(Boolean)
        return partes.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
    }

    const abrirNuevoEmpleado = () => {
        setEditandoId(null)
        setNombreCompleto('')
        setTelefono('')
        setDepartamento('Operaciones')
        setPuesto('')
        setFechaInicio(new Date().toISOString().split('T')[0])
        setFechaNacimiento('')
        setActivo(true)
        setAplicaKPI(true)
        setFrecuenciaKpiPref('MENSUAL')
        setFechaSalida('')
        setMotivoSalida('')
        setFotoUrlActual('')
        setArchivoFoto(null)
        setModalEmpleado(true)
    }

    const abrirEdicionEmpleado = (emp) => {
        setEditandoId(emp.EmpleadoID)
        setNombreCompleto(emp.NombreCompleto || '')
        setTelefono(emp.Telefono || '')
        setDepartamento(emp.Departamento || 'Operaciones')
        setPuesto(emp.Puesto || '')
        setFechaInicio(emp.FechaInicio ? String(emp.FechaInicio).split('T')[0] : '')
        setFechaNacimiento(emp.FechaNacimiento ? String(emp.FechaNacimiento).split('T')[0] : '')
        setActivo(Boolean(emp.Activo))
        setAplicaKPI(empleadoAplicaKPI(emp))
        setFrecuenciaKpiPref(emp.FrecuenciaKPI || 'MENSUAL')
        setFechaSalida(emp.FechaSalida ? String(emp.FechaSalida).split('T')[0] : new Date().toISOString().split('T')[0])
        setMotivoSalida(emp.MotivoSalida || '')
        setFotoUrlActual(limpiarUrlTexto(emp.URL_SaaS || emp.FotoURL || emp.FotoActivaURL))
        setArchivoFoto(null)
        setModalEmpleado(true)
    }

    const guardarEmpleado = async (e) => {
        e.preventDefault()
        setGuardando(true)
        try {
            const url = editandoId
                ? `${API_URL}/api/rh/personal/${editandoId}`
                : `${API_URL}/api/rh/personal`
            const metodo = editandoId ? 'PUT' : 'POST'

            const formData = new FormData()
            formData.append('nombreCompleto', nombreCompleto)
            formData.append('telefono', telefono)
            formData.append('departamento', departamento)
            formData.append('puesto', puesto)
            if (fechaInicio) formData.append('fechaInicio', fechaInicio)
            if (fechaNacimiento) formData.append('fechaNacimiento', fechaNacimiento)
            formData.append('activo', String(activo))
            formData.append('aplicaKPI', String(aplicaKPI))
            formData.append('frecuenciaKPI', frecuenciaKpiPref)
            if (!activo && fechaSalida) formData.append('fechaSalida', fechaSalida)
            if (!activo && motivoSalida) formData.append('motivoSalida', motivoSalida)
            if (fotoUrlActual) formData.append('fotoUrlActual', fotoUrlActual)
            if (archivoFoto) formData.append('foto', archivoFoto)

            const res = await fetch(url, {
                method: metodo,
                body: formData
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data.error || 'Error al guardar el expediente del colaborador')

            if (mostrarToast) {
                mostrarToast(
                    editandoId
                        ? `Datos de "${nombreCompleto}" actualizados`
                        : `Colaborador "${nombreCompleto}" registrado en RH`
                )
            }
            setModalEmpleado(false)
            if (recargarDatos) recargarDatos()
        } catch (err) {
            if (mostrarToast) mostrarToast(err.message, 'error')
        } finally {
            setGuardando(false)
        }
    }

    const abrirExpedienteDigital = async (emp) => {
        setEmpleadoExpediente(emp)
        setMostrarFormDoc(false) // Inicia contraído para priorizar la vista de documentos
        setFiltroTipoDoc('TODOS')
        setMostrarArchivados(false)
        setTituloDoc('')
        setTipoDoc('Pase de Acceso a Planta')
        setFechaDoc(new Date().toISOString().split('T')[0])
        setFechaVencimientoDoc('')
        setNotasDoc('')
        setArchivoDoc(null)
        setCargandoDocs(true)

        try {
            const res = await fetch(`${API_URL}/api/rh/personal/${emp.EmpleadoID}/documentos?t=${Date.now()}`)
            if (res.ok) {
                setDocumentosEmpleado(await res.json())
            } else {
                setDocumentosEmpleado([])
            }
        } catch {
            setDocumentosEmpleado([])
        } finally {
            setCargandoDocs(false)
        }
    }

    const subirDocumentoEmpleado = async (e) => {
        e.preventDefault()
        if (!empleadoExpediente || !archivoDoc) {
            if (mostrarToast) mostrarToast('Selecciona un archivo para subir al expediente', 'alerta')
            return
        }
        setSubiendoDoc(true)
        try {
            const formData = new FormData()
            formData.append('tituloDocumento', tituloDoc.trim() || archivoDoc.name)
            formData.append('tipoDocumento', tipoDoc)
            if (fechaDoc) formData.append('fechaDocumento', fechaDoc)
            if (fechaVencimientoDoc) formData.append('fechaVencimiento', fechaVencimientoDoc)
            if (notasDoc) formData.append('notas', notasDoc)
            formData.append('archivo', archivoDoc)

            const res = await fetch(`${API_URL}/api/rh/personal/${empleadoExpediente.EmpleadoID}/documentos`, {
                method: 'POST',
                body: formData
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data.error || 'Error al subir el documento')

            setDocumentosEmpleado((prev) => [data, ...prev])
            setTituloDoc('')
            setFechaVencimientoDoc('')
            setNotasDoc('')
            setArchivoDoc(null)
            setMostrarFormDoc(false)
            if (mostrarToast) mostrarToast('Documento guardado en el expediente del colaborador')
            if (recargarDatos) recargarDatos()
        } catch (err) {
            if (mostrarToast) mostrarToast(err.message, 'error')
        } finally {
            setSubiendoDoc(false)
        }
    }

    const actualizarFechaTerminoManual = async (docId, nuevaFecha) => {
        try {
            const res = await fetch(`${API_URL}/api/rh/documentos/${docId}/vigencia`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fechaVencimiento: nuevaFecha || null })
            })
            if (!res.ok) throw new Error('No se pudo actualizar la fecha de término')

            setDocumentosEmpleado((prev) =>
                prev.map((d) => (d.DocumentoID === docId ? { ...d, FechaVencimiento: nuevaFecha || null } : d))
            )
            if (mostrarToast) mostrarToast('Fecha de referencia actualizada')
        } catch (err) {
            if (mostrarToast) mostrarToast(err.message, 'error')
        }
    }

    const actualizarFotoDirectaEnExpediente = async (file) => {
        if (!file || !empleadoExpediente) return
        setSubiendoDoc(true)
        try {
            const formData = new FormData()
            formData.append('foto', file)
            const res = await fetch(`${API_URL}/api/rh/personal/${empleadoExpediente.EmpleadoID}/foto`, {
                method: 'POST',
                body: formData
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data.error || 'No se pudo subir la foto')

            setEmpleadoExpediente((prev) => ({
                ...prev,
                URL_SaaS: data.URL_SaaS || data.fotoUrl,
                FotoURL: data.fotoUrl
            }))
            if (mostrarToast) mostrarToast('Fotografía de perfil actualizada')
            const resDocs = await fetch(`${API_URL}/api/rh/personal/${empleadoExpediente.EmpleadoID}/documentos?t=${Date.now()}`)
            if (resDocs.ok) setDocumentosEmpleado(await resDocs.json())
            if (recargarDatos) recargarDatos()
        } catch (err) {
            if (mostrarToast) mostrarToast(err.message, 'error')
        } finally {
            setSubiendoDoc(false)
        }
    }

    const ocultarDocumentoEnERP = async (docId) => {
        try {
            const res = await fetch(`${API_URL}/api/rh/documentos/${docId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('No se pudo actualizar el estado del documento')
            setDocumentosEmpleado((prev) =>
                prev.map((d) => (d.DocumentoID === docId ? { ...d, Activo: false } : d))
            )
            if (mostrarToast) mostrarToast('Documento quitado de la vista activa (respaldado en base de datos)', 'alerta')
            if (recargarDatos) recargarDatos()
        } catch (err) {
            if (mostrarToast) mostrarToast(err.message, 'error')
        }
    }

    // Construye la clave de periodo según la frecuencia seleccionada (ej. "2026-W42", "2026-10", "2026-B5")
    const obtenerCodigoPeriodoActual = () => {
        if (tipoPeriodoKpi === 'SEMANAL') return periodoSemana
        if (tipoPeriodoKpi === 'BIMESTRAL') return `${anioBimestre}-${numBimestre}`
        return periodoMes
    }

    // Carga una evaluación existente en el formulario lateral para corregir su puntaje
    const cargarKpiParaEdicion = (ev) => {
        setEditandoKpiId(ev.EvaluacionID)
        setEmpKpiId(String(ev.EmpleadoID))
        const empObj = personalRH.find((p) => Number(p.EmpleadoID) === Number(ev.EmpleadoID))
        if (empObj) setEmpleadoSeleccionado(empObj)

        const per = String(ev.PeriodoMes || '')
        if (per.includes('-W')) {
            setTipoPeriodoKpi('SEMANAL')
            setPeriodoSemana(per)
        } else if (per.includes('-B')) {
            setTipoPeriodoKpi('BIMESTRAL')
            const [a, b] = per.split('-')
            setAnioBimestre(a || String(new Date().getFullYear()))
            setNumBimestre(b || 'B1')
        } else {
            setTipoPeriodoKpi('MENSUAL')
            setPeriodoMes(per.slice(0, 7))
        }

        setKpiPuntualidad(Number(ev.KpiPuntualidad ?? 95))
        setKpiCalidad(Number(ev.KpiCalidad ?? 95))
        setKpiProductividad(Number(ev.KpiProductividad ?? 90))
        setKpiSeguridad5S(Number(ev.KpiSeguridad5S ?? 95))
        setKpiColaboracion(Number(ev.KpiColaboracion ?? 95))
        setMetasCumplidas(Number(ev.MetasCumplidas ?? 5))
        setMetasAsignadas(Number(ev.MetasAsignadas ?? 5))
        setComentariosKpi(ev.Comentarios || '')
    }

    const cancelarEdicionKpi = () => {
        setEditandoKpiId(null)
        setKpiPuntualidad(95)
        setKpiCalidad(95)
        setKpiProductividad(90)
        setKpiSeguridad5S(95)
        setKpiColaboracion(95)
        setMetasCumplidas(5)
        setMetasAsignadas(5)
        setComentariosKpi('')
    }

    const guardarEvaluacionKPI = async (e) => {
        e.preventDefault()
        if (!empKpiId) {
            if (mostrarToast) mostrarToast('Selecciona un colaborador para evaluar', 'alerta')
            return
        }
        const periodoFinal = obtenerCodigoPeriodoActual()
        if (!periodoFinal) {
            if (mostrarToast) mostrarToast('Indica el periodo de evaluación', 'alerta')
            return
        }

        setGuardando(true)
        try {
            const payload = {
                evaluacionID: editandoKpiId,
                empleadoID: empKpiId,
                periodoMes: periodoFinal,
                frecuencia: tipoPeriodoKpi,
                areaEvaluada: areaActualKPI,
                kpiPuntualidad: Number(kpiPuntualidad),
                kpiCalidad: Number(kpiCalidad),
                kpiProductividad: Number(kpiProductividad),
                kpiSeguridad5S: Number(kpiSeguridad5S),
                kpiColaboracion: Number(kpiColaboracion),
                metasCumplidas: Number(metasCumplidas),
                metasAsignadas: Number(metasAsignadas),
                comentarios: comentariosKpi
            }

            // Si estamos editando intenta PUT /api/rh/kpis/:id y si el backend usa upsert en POST hace fallback automático
            let res
            if (editandoKpiId) {
                res = await fetch(`${API_URL}/api/rh/kpis/${editandoKpiId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                if (res.status === 404 || res.status === 405) {
                    res = await fetch(`${API_URL}/api/rh/kpis`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    })
                }
            } else {
                res = await fetch(`${API_URL}/api/rh/kpis`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
            }

            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data.error || 'Error al guardar KPIs')

            if (mostrarToast) {
                mostrarToast(editandoKpiId ? 'Evaluación corregida correctamente' : (data.mensaje || 'Evaluación registrada'))
            }
            setEditandoKpiId(null)
            setComentariosKpi('')
            if (recargarDatos) recargarDatos()
        } catch (err) {
            if (mostrarToast) mostrarToast(err.message, 'error')
        } finally {
            setGuardando(false)
        }
    }

    const promedioCalculadoEnVivo = useMemo(() => {
        const sum =
            Number(kpiPuntualidad) +
            Number(kpiCalidad) +
            Number(kpiProductividad) +
            Number(kpiSeguridad5S) +
            Number(kpiColaboracion)
        return (sum / 5).toFixed(1)
    }, [kpiPuntualidad, kpiCalidad, kpiProductividad, kpiSeguridad5S, kpiColaboracion])

    const kpisDelEmpleadoSeleccionado = useMemo(() => {
        if (!empleadoSeleccionado) return []
        return evaluacionesKPI.filter((k) => Number(k.EmpleadoID) === Number(empleadoSeleccionado.EmpleadoID))
    }, [evaluacionesKPI, empleadoSeleccionado])

    const documentosFiltrados = useMemo(() => {
        return documentosEmpleado.filter((d) => {
            const esActivo = d.Activo === undefined || d.Activo === null ? true : Boolean(d.Activo)
            if (!mostrarArchivados && !esActivo) return false
            if (filtroTipoDoc !== 'TODOS' && d.TipoDocumento !== filtroTipoDoc) return false
            return true
        })
    }, [documentosEmpleado, filtroTipoDoc, mostrarArchivados])

    const formatearEtiquetaPeriodo = (codigo) => {
        if (!codigo) return '—'
        const str = String(codigo)
        if (str.includes('-W')) return `🗓️ Sem ${str.replace('-W', ' #')}`
        if (str.includes('-B')) return `📅 Bim ${str}`
        return `📆 Mes ${str}`
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* BARRA SUPERIOR DE RECURSOS HUMANOS */}
            <div className="pro-card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div className="pro-segmented">
                    <button
                        type="button"
                        className={`pro-segmented-btn ${subVista === 'directorio' ? 'active' : ''}`}
                        onClick={() => setSubVista('directorio')}
                    >
                        👥 Plantilla y Expedientes ({personalRH.filter((p) => p.Activo).length} Activos / {personalRH.filter((p) => !p.Activo).length} Bajas)
                    </button>
                    <button
                        type="button"
                        className={`pro-segmented-btn ${subVista === 'rendimiento' ? 'active' : ''}`}
                        onClick={() => setSubVista('rendimiento')}
                    >
                        📈 Evaluación de Rendimiento (KPIs por Área)
                    </button>
                </div>

                {puedeEditar && subVista === 'directorio' && (
                    <button type="button" onClick={abrirNuevoEmpleado} className="pro-btn pro-btn-primary">
                        ➕ Dar de Alta Colaborador (Sin Perfil ERP)
                    </button>
                )}
            </div>

            {/* VISTA 1: DIRECTORIO DE PERSONAL, FOTOS Y EXPEDIENTE DIGITAL */}
            {subVista === 'directorio' && (
                <div className="pro-card" style={{ padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                        <div className="pro-segmented">
                            <button
                                type="button"
                                className={`pro-segmented-btn ${filtroEstatus === 'activos' ? 'active' : ''}`}
                                onClick={() => setFiltroEstatus('activos')}
                            >
                                🟢 Activos ({personalRH.filter((p) => p.Activo).length})
                            </button>
                            <button
                                type="button"
                                className={`pro-segmented-btn ${filtroEstatus === 'inactivos' ? 'active' : ''}`}
                                onClick={() => setFiltroEstatus('inactivos')}
                            >
                                🔴 Bajas / Histórico ({personalRH.filter((p) => !p.Activo).length})
                            </button>
                            <button
                                type="button"
                                className={`pro-segmented-btn ${filtroEstatus === 'todos' ? 'active' : ''}`}
                                onClick={() => setFiltroEstatus('todos')}
                            >
                                Todos ({personalRH.length})
                            </button>
                        </div>

                        <input
                            type="text"
                            placeholder="🔍 Buscar por nombre, área o puesto..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="pro-input"
                            style={{ maxWidth: '320px' }}
                        />
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: '#f8fafc', textAlign: 'left' }}>
                                    <th style={{ padding: '10px 12px' }}>Colaborador</th>
                                    <th style={{ padding: '10px 12px' }}>Área / Puesto</th>
                                    <th style={{ padding: '10px 12px' }}>Teléfono</th>
                                    <th style={{ padding: '10px 12px' }}>Ingreso / Cumpleaños</th>
                                    <th style={{ padding: '10px 12px' }}>Estatus / Salida</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>KPI Promedio</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Expediente y Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {personalFiltrado.map((emp) => {
                                    const kpi = emp.PromedioHistoricoKPI ? Number(emp.PromedioHistoricoKPI).toFixed(1) : null
                                    const totalDocs = Number(emp.TotalDocumentos) || 0
                                    const fotoRaw = limpiarUrlTexto(emp.URL_SaaS || emp.FotoURL || emp.FotoActivaURL)
                                    const participaKpi = empleadoAplicaKPI(emp)

                                    return (
                                        <tr key={emp.EmpleadoID} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', opacity: emp.Activo ? 1 : 0.72 }}>
                                            <td style={{ padding: '10px 12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {fotoRaw ? (
                                                        <img
                                                            src={obtenerUrlSegura(fotoRaw)}
                                                            alt={emp.NombreCompleto}
                                                            onClick={() => abrirVisorCentrado(`Fotografía: ${emp.NombreCompleto}`, fotoRaw, 'foto.png')}
                                                            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0071e3', flexShrink: 0, cursor: 'pointer' }}
                                                            title="Clic para abrir fotografía en el visor"
                                                        />
                                                    ) : (
                                                        <div
                                                            style={{
                                                                width: '38px',
                                                                height: '38px',
                                                                borderRadius: '50%',
                                                                background: 'linear-gradient(135deg, #0071e3, #38bdf8)',
                                                                color: '#fff',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 800,
                                                                fontSize: '13px',
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            {obtenerIniciales(emp.NombreCompleto)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: '#1d1d1f' }}>{emp.NombreCompleto}</div>
                                                        <div className="pro-mono" style={{ fontSize: '11px', color: '#86868b' }}>
                                                            ID #{emp.EmpleadoID} {!participaKpi && '· (Exento KPI)'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <strong>{emp.Departamento}</strong>
                                                {emp.Puesto && <div style={{ fontSize: '11.5px', color: '#86868b' }}>{emp.Puesto}</div>}
                                            </td>
                                            <td className="pro-mono" style={{ padding: '10px 12px' }}>{emp.Telefono || '—'}</td>
                                            <td className="pro-mono" style={{ padding: '10px 12px', fontSize: '11.5px' }}>
                                                <div>📅 Ingreso: {emp.FechaInicio ? String(emp.FechaInicio).split('T')[0] : '—'}</div>
                                                <div style={{ color: '#86868b' }}>🎂 Nac: {emp.FechaNacimiento ? String(emp.FechaNacimiento).split('T')[0] : '—'}</div>
                                            </td>
                                            <td style={{ padding: '10px 12px' }}>
                                                {emp.Activo ? (
                                                    <span className="pro-badge" style={{ backgroundColor: '#ecfdf5', color: '#065f46' }}>
                                                        ● Activo
                                                    </span>
                                                ) : (
                                                    <div>
                                                        <span className="pro-badge" style={{ backgroundColor: '#fef2f2', color: '#991b1b' }}>
                                                            ● Baja: {emp.FechaSalida ? String(emp.FechaSalida).split('T')[0] : 'Sí'}
                                                        </span>
                                                        {emp.MotivoSalida && (
                                                            <div style={{ fontSize: '11px', color: '#86868b', marginTop: '2px' }}>
                                                                {emp.MotivoSalida}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                {!participaKpi ? (
                                                    <span style={{ fontSize: '11px', color: '#86868b' }}>No aplica</span>
                                                ) : kpi ? (
                                                    <span
                                                        className="pro-badge pro-mono"
                                                        style={{
                                                            backgroundColor: kpi >= 90 ? '#ecfdf5' : kpi >= 75 ? '#fffbeb' : '#fef2f2',
                                                            color: kpi >= 90 ? '#065f46' : kpi >= 75 ? '#92400e' : '#991b1b',
                                                            fontWeight: 800
                                                        }}
                                                    >
                                                        {kpi}%
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '11.5px', color: '#86868b' }}>Sin evaluar</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirExpedienteDigital(emp)}
                                                        className="pro-btn pro-btn-primary pro-btn-sm"
                                                    >
                                                        📂 Archivos ({totalDocs})
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEmpleadoSeleccionado(emp)
                                                            setEmpKpiId(String(emp.EmpleadoID))
                                                            if (emp.FrecuenciaKPI) setTipoPeriodoKpi(emp.FrecuenciaKPI)
                                                            setSubVista('rendimiento')
                                                        }}
                                                        className="pro-btn pro-btn-secondary pro-btn-sm"
                                                    >
                                                        📊 KPIs
                                                    </button>
                                                    {puedeEditar && (
                                                        <button
                                                            type="button"
                                                            onClick={() => abrirEdicionEmpleado(emp)}
                                                            className="pro-btn pro-btn-secondary pro-btn-sm"
                                                        >
                                                            ✏️ Editar
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* VISTA 2: PERFIL DE RENDIMIENTO Y CAPTURA DINÁMICA DE KPIs */}
            {subVista === 'rendimiento' && (
                <div style={{ display: 'grid', gridTemplateColumns: puedeEditar ? '420px 1fr' : '1fr', gap: '18px', alignItems: 'start' }}>
                    {puedeEditar && (
                        <form onSubmit={guardarEvaluacionKPI} className="pro-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                <h3 style={{ fontSize: '15px', margin: 0 }}>
                                    {editandoKpiId ? '✏️ Corregir Evaluación KPI' : '🎯 Evaluar KPIs'}
                                </h3>
                                <span className="pro-badge pro-mono" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 800 }}>
                                    Score: {promedioCalculadoEnVivo}%
                                </span>
                            </div>

                            {editandoKpiId && (
                                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', color: '#92400e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Editando evaluación #{editandoKpiId}</span>
                                    <button type="button" onClick={cancelarEdicionKpi} className="pro-btn pro-btn-secondary pro-btn-sm" style={{ padding: '2px 8px', fontSize: '11px' }}>
                                        Cancelar edición
                                    </button>
                                </div>
                            )}

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <label className="pro-label" style={{ margin: 0 }}>Colaborador *</label>
                                    <label style={{ fontSize: '11px', color: '#515154', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={soloElegiblesKPI}
                                            onChange={(e) => setSoloElegiblesKPI(e.target.checked)}
                                        />
                                        Solo personal con KPI activo
                                    </label>
                                </div>
                                <select
                                    value={empKpiId}
                                    onChange={(e) => {
                                        setEmpKpiId(e.target.value)
                                        const encontrado = personalRH.find((p) => String(p.EmpleadoID) === e.target.value)
                                        setEmpleadoSeleccionado(encontrado || null)
                                        if (encontrado?.FrecuenciaKPI && !editandoKpiId) {
                                            setTipoPeriodoKpi(encontrado.FrecuenciaKPI)
                                        }
                                    }}
                                    required
                                    className="pro-select"
                                >
                                    <option value="">-- Seleccionar colaborador --</option>
                                    {personalParaSelectorKPI.map((p) => (
                                        <option key={p.EmpleadoID} value={p.EmpleadoID}>
                                            {p.NombreCompleto} · {p.Departamento} ({p.Activo ? 'Activo' : 'Baja'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* INDICADOR DEL ÁREA Y SUS RUBROS PERSONALIZADOS */}
                            <div style={{ backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>🏢 Área evaluada: <strong>{areaActualKPI}</strong></span>
                                <span style={{ fontSize: '11px', color: '#0071e3', fontWeight: 600 }}>KPIs adaptados al área</span>
                            </div>

                            {/* SELECTOR DE FRECUENCIA: SEMANAL, MENSUAL, BIMESTRAL */}
                            <div>
                                <label className="pro-label">Frecuencia de Evaluación *</label>
                                <div className="pro-segmented" style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                                    {[
                                        { id: 'SEMANAL', label: 'Semanal' },
                                        { id: 'MENSUAL', label: 'Mensual' },
                                        { id: 'BIMESTRAL', label: 'Bimestral' }
                                    ].map((f) => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => setTipoPeriodoKpi(f.id)}
                                            className={`pro-segmented-btn ${tipoPeriodoKpi === f.id ? 'active' : ''}`}
                                            style={{ textAlign: 'center', justifyContent: 'center' }}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* INPUT DEL PERIODO SEGÚN LA FRECUENCIA */}
                            {tipoPeriodoKpi === 'SEMANAL' && (
                                <div>
                                    <label className="pro-label">Semana Evaluada *</label>
                                    <input
                                        type="week"
                                        value={periodoSemana}
                                        onChange={(e) => setPeriodoSemana(e.target.value)}
                                        required
                                        className="pro-input pro-mono"
                                    />
                                </div>
                            )}

                            {tipoPeriodoKpi === 'MENSUAL' && (
                                <div>
                                    <label className="pro-label">Mes Evaluado *</label>
                                    <input
                                        type="month"
                                        value={periodoMes}
                                        onChange={(e) => setPeriodoMes(e.target.value)}
                                        required
                                        className="pro-input pro-mono"
                                    />
                                </div>
                            )}

                            {tipoPeriodoKpi === 'BIMESTRAL' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px' }}>
                                    <div>
                                        <label className="pro-label">Año *</label>
                                        <input
                                            type="number"
                                            min="2024"
                                            max="2035"
                                            value={anioBimestre}
                                            onChange={(e) => setAnioBimestre(e.target.value)}
                                            required
                                            className="pro-input pro-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="pro-label">Bimestre *</label>
                                        <select
                                            value={numBimestre}
                                            onChange={(e) => setNumBimestre(e.target.value)}
                                            className="pro-select"
                                        >
                                            {BIMESTRES.map((b) => (
                                                <option key={b.val} value={b.val}>{b.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* RUBROS DE KPI CON SLIDER + INPUT NUMÉRICO DIRECTO PARA CORREGIR FÁCILMENTE */}
                            {[
                                { label: definicionRubrosKPI[0].label, val: kpiPuntualidad, set: setKpiPuntualidad },
                                { label: definicionRubrosKPI[1].label, val: kpiCalidad, set: setKpiCalidad },
                                { label: definicionRubrosKPI[2].label, val: kpiProductividad, set: setKpiProductividad },
                                { label: definicionRubrosKPI[3].label, val: kpiSeguridad5S, set: setKpiSeguridad5S },
                                { label: definicionRubrosKPI[4].label, val: kpiColaboracion, set: setKpiColaboracion }
                            ].map((item, i) => (
                                <div key={i} style={{ backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 600, marginBottom: '4px', gap: '8px' }}>
                                        <span>{item.label}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={item.val}
                                                onChange={(e) => {
                                                    const n = Math.max(0, Math.min(100, Number(e.target.value) || 0))
                                                    item.set(n)
                                                }}
                                                className="pro-input pro-mono"
                                                style={{ width: '64px', padding: '2px 6px', fontSize: '12px', textAlign: 'right', height: '26px' }}
                                            />
                                            <span className="pro-mono" style={{ fontSize: '12px' }}>%</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={item.val}
                                        onChange={(e) => item.set(Number(e.target.value))}
                                        style={{ width: '100%', cursor: 'pointer' }}
                                    />
                                </div>
                            ))}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label className="pro-label">Metas Cumplidas</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={metasCumplidas}
                                        onChange={(e) => setMetasCumplidas(e.target.value)}
                                        className="pro-input pro-mono"
                                    />
                                </div>
                                <div>
                                    <label className="pro-label">Metas Asignadas</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={metasAsignadas}
                                        onChange={(e) => setMetasAsignadas(e.target.value)}
                                        className="pro-input pro-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="pro-label">Retroalimentación / Observaciones</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Excelente entrega en proyecto línea de ensamble..."
                                    value={comentariosKpi}
                                    onChange={(e) => setComentariosKpi(e.target.value)}
                                    className="pro-input"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                {editandoKpiId && (
                                    <button type="button" onClick={cancelarEdicionKpi} className="pro-btn pro-btn-secondary" style={{ flex: 1 }}>
                                        Cancelar
                                    </button>
                                )}
                                <button type="submit" disabled={guardando} className="pro-btn pro-btn-primary" style={{ flex: 2 }}>
                                    {guardando
                                        ? 'Guardando...'
                                        : editandoKpiId
                                            ? '💾 Guardar Corrección de KPI'
                                            : '💾 Guardar Evaluación'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* HISTÓRICO Y PERFIL DE RENDIMIENTO */}
                    <div className="pro-card" style={{ padding: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                                <h3 style={{ fontSize: '15.5px', margin: 0 }}>
                                    {empleadoSeleccionado
                                        ? `📊 Historial de Rendimiento: ${empleadoSeleccionado.NombreCompleto}`
                                        : '📊 Bitácora General de Evaluaciones (KPIs)'}
                                </h3>
                                <span style={{ fontSize: '12px', color: '#86868b' }}>
                                    Haz clic en "✏️ Corregir" en cualquier fila para modificar los puntajes asignados
                                </span>
                            </div>
                            {empleadoSeleccionado && (
                                <button
                                    type="button"
                                    onClick={() => setEmpleadoSeleccionado(null)}
                                    className="pro-btn pro-btn-secondary pro-btn-sm"
                                >
                                    Ver Todos los Colaboradores
                                </button>
                            )}
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: '#f8fafc', textAlign: 'left' }}>
                                        <th style={{ padding: '10px 12px' }}>Periodo</th>
                                        <th style={{ padding: '10px 12px' }}>Colaborador / Área</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>KPI 1</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>KPI 2</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>KPI 3</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>KPI 4</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>KPI 5</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Metas</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Score Global</th>
                                        <th style={{ padding: '10px 12px' }}>Observaciones</th>
                                        {puedeEditar && <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acciones</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(empleadoSeleccionado ? kpisDelEmpleadoSeleccionado : evaluacionesKPI).map((ev) => {
                                        const prom = Number(ev.PromedioGlobal || 0).toFixed(1)
                                        const empInfo = personalRH.find((p) => Number(p.EmpleadoID) === Number(ev.EmpleadoID))
                                        const depto = empInfo?.Departamento || 'Operaciones'
                                        const rubros = KPIS_POR_AREA[depto] || KPIS_POR_AREA['Operaciones']
                                        const estaEditandoEstaFila = Number(editandoKpiId) === Number(ev.EvaluacionID)

                                        return (
                                            <tr
                                                key={ev.EvaluacionID}
                                                style={{
                                                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                                                    backgroundColor: estaEditandoEstaFila ? '#eff6ff' : 'transparent'
                                                }}
                                            >
                                                <td className="pro-mono" style={{ padding: '10px 12px', fontWeight: 700 }}>
                                                    {formatearEtiquetaPeriodo(ev.PeriodoMes)}
                                                </td>
                                                <td style={{ padding: '10px 12px' }}>
                                                    <div style={{ fontWeight: 700 }}>{ev.NombreCompleto}</div>
                                                    <div style={{ fontSize: '11px', color: '#86868b' }}>{depto}</div>
                                                </td>
                                                <td className="pro-mono" style={{ padding: '10px 12px', textAlign: 'center' }} title={rubros[0].label}>
                                                    {ev.KpiPuntualidad}%
                                                </td>
                                                <td className="pro-mono" style={{ padding: '10px 12px', textAlign: 'center' }} title={rubros[1].label}>
                                                    {ev.KpiCalidad}%
                                                </td>
                                                <td className="pro-mono" style={{ padding: '10px 12px', textAlign: 'center' }} title={rubros[2].label}>
                                                    {ev.KpiProductividad}%
                                                </td>
                                                <td className="pro-mono" style={{ padding: '10px 12px', textAlign: 'center' }} title={rubros[3].label}>
                                                    {ev.KpiSeguridad5S}%
                                                </td>
                                                <td className="pro-mono" style={{ padding: '10px 12px', textAlign: 'center' }} title={rubros[4].label}>
                                                    {ev.KpiColaboracion ?? '—'}%
                                                </td>
                                                <td className="pro-mono" style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                    {ev.MetasCumplidas}/{ev.MetasAsignadas}
                                                </td>
                                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                    <span
                                                        className="pro-badge pro-mono"
                                                        style={{
                                                            backgroundColor: prom >= 90 ? '#ecfdf5' : prom >= 75 ? '#fffbeb' : '#fef2f2',
                                                            color: prom >= 90 ? '#065f46' : prom >= 75 ? '#92400e' : '#991b1b',
                                                            fontWeight: 800
                                                        }}
                                                    >
                                                        {prom}%
                                                    </span>
                                                </td>
                                                <td style={{ padding: '10px 12px', color: '#515154' }}>{ev.Comentarios || '—'}</td>
                                                {puedeEditar && (
                                                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => cargarKpiParaEdicion(ev)}
                                                            className="pro-btn pro-btn-secondary pro-btn-sm"
                                                            title="Cargar puntajes en el formulario para corregirlos"
                                                        >
                                                            ✏️ Corregir
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE EXPEDIENTE DIGITAL Y DOCUMENTOS (CON MENÚ EXPANDIBLE) */}
            {empleadoExpediente &&
                createPortal(
                    <div className="pro-modal-backdrop" onClick={() => setEmpleadoExpediente(null)}>
                        <div
                            className="pro-modal-window"
                            style={{
                                maxWidth: '940px',
                                width: '94vw',
                                maxHeight: '88vh',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="pro-modal-header" style={{ flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {limpiarUrlTexto(empleadoExpediente.URL_SaaS || empleadoExpediente.FotoURL) ? (
                                        <img
                                            src={obtenerUrlSegura(empleadoExpediente.URL_SaaS || empleadoExpediente.FotoURL)}
                                            alt={empleadoExpediente.NombreCompleto}
                                            onClick={() =>
                                                abrirVisorCentrado(
                                                    `Fotografía: ${empleadoExpediente.NombreCompleto}`,
                                                    empleadoExpediente.URL_SaaS || empleadoExpediente.FotoURL,
                                                    'foto.png'
                                                )
                                            }
                                            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0071e3', cursor: 'pointer' }}
                                            title="Clic para abrir en el visor centrado"
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #0071e3, #38bdf8)',
                                                color: '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 800,
                                                fontSize: '16px'
                                            }}
                                        >
                                            {obtenerIniciales(empleadoExpediente.NombreCompleto)}
                                        </div>
                                    )}
                                    <div>
                                        <h3 style={{ fontSize: '16.5px', margin: 0 }}>
                                            📂 Expediente Digital: {empleadoExpediente.NombreCompleto}
                                        </h3>
                                        <span style={{ fontSize: '12px', color: '#86868b' }}>
                                            {empleadoExpediente.Departamento} · {empleadoExpediente.Puesto || 'Colaborador'}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {puedeEditar && (
                                        <label className="pro-btn pro-btn-secondary pro-btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                                            📷 Cambiar Foto
                                            <input
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) actualizarFotoDirectaEnExpediente(e.target.files[0])
                                                }}
                                            />
                                        </label>
                                    )}
                                    <button onClick={() => setEmpleadoExpediente(null)} className="pro-btn pro-btn-secondary pro-btn-sm">✕</button>
                                </div>
                            </div>

                            <div
                                className="pro-modal-body"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '14px',
                                    overflowY: 'auto',
                                    flex: 1
                                }}
                            >
                                {/* BARRA DE CATEGORÍAS + BOTÓN PARA EXPANDIR EL FORMULARIO DE CARGA */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', flexShrink: 0 }}>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            onClick={() => setFiltroTipoDoc('TODOS')}
                                            className={`pro-btn pro-btn-sm ${filtroTipoDoc === 'TODOS' ? 'pro-btn-primary' : 'pro-btn-secondary'}`}
                                        >
                                            Todos ({documentosFiltrados.length})
                                        </button>
                                        {CATEGORIAS_DOCUMENTOS.map((cat) => {
                                            const count = documentosEmpleado.filter((d) => (mostrarArchivados || d.Activo !== false) && d.TipoDocumento === cat).length
                                            if (count === 0) return null
                                            return (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => setFiltroTipoDoc(cat)}
                                                    className={`pro-btn pro-btn-sm ${filtroTipoDoc === cat ? 'pro-btn-primary' : 'pro-btn-secondary'}`}
                                                >
                                                    {cat} ({count})
                                                </button>
                                            )
                                        })}
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            onClick={() => setMostrarArchivados(!mostrarArchivados)}
                                            className={`pro-btn pro-btn-sm ${mostrarArchivados ? 'pro-btn-dark' : 'pro-btn-secondary'}`}
                                        >
                                            {mostrarArchivados ? '👁️ Ocultar Reemplazados' : '🗄️ Ver Historial / Reemplazados'}
                                        </button>

                                        {puedeEditar && (
                                            <button
                                                type="button"
                                                onClick={() => setMostrarFormDoc((prev) => !prev)}
                                                className={`pro-btn pro-btn-sm ${mostrarFormDoc ? 'pro-btn-secondary' : 'pro-btn-primary'}`}
                                            >
                                                {mostrarFormDoc ? '➖ Ocultar Formulario' : '➕ Agregar Documento'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* FORMULARIO EXPANDIBLE PARA SUBIR ARCHIVOS */}
                                {puedeEditar && mostrarFormDoc && (
                                    <form
                                        onSubmit={subirDocumentoEmpleado}
                                        style={{
                                            backgroundColor: '#f8fafc',
                                            padding: '16px',
                                            borderRadius: '12px',
                                            border: '1px solid #cbd5e1',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px',
                                            flexShrink: 0
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <strong style={{ fontSize: '13.5px', color: '#0071e3' }}>
                                                ☁️ Subir Nuevo Documento, Permiso, Curso o Pase de Planta
                                            </strong>
                                            <button
                                                type="button"
                                                onClick={() => setMostrarFormDoc(false)}
                                                className="pro-btn pro-btn-secondary pro-btn-sm"
                                                style={{ padding: '2px 8px', fontSize: '11px' }}
                                            >
                                                ✕ Cerrar
                                            </button>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                                            <div>
                                                <label className="pro-label">Categoría del Documento *</label>
                                                <select value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)} className="pro-select">
                                                    {CATEGORIAS_DOCUMENTOS.map((cat) => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="pro-label">Título / Descripción *</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej. Pase Acceso Planta / Examen Médico / DC-3..."
                                                    value={tituloDoc}
                                                    onChange={(e) => setTituloDoc(e.target.value)}
                                                    required
                                                    className="pro-input"
                                                />
                                            </div>

                                            <div>
                                                <label className="pro-label">Fecha de Emisión / Inicio</label>
                                                <input
                                                    type="date"
                                                    value={fechaDoc}
                                                    onChange={(e) => setFechaDoc(e.target.value)}
                                                    className="pro-input pro-mono"
                                                />
                                            </div>

                                            <div>
                                                <label className="pro-label">Fecha Fin de Permiso / Vigencia (Manual)</label>
                                                <input
                                                    type="date"
                                                    value={fechaVencimientoDoc}
                                                    onChange={(e) => setFechaVencimientoDoc(e.target.value)}
                                                    className="pro-input pro-mono"
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                                            <div>
                                                <label className="pro-label">Notas / Observaciones</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej. Permiso autorizado por 3 días, acceso planta nave 2..."
                                                    value={notasDoc}
                                                    onChange={(e) => setNotasDoc(e.target.value)}
                                                    className="pro-input"
                                                />
                                            </div>

                                            <div>
                                                <label className="pro-label">Archivo (PDF, Imagen, Word, etc.) *</label>
                                                <input
                                                    type="file"
                                                    onChange={(e) => setArchivoDoc(e.target.files?.[0] || null)}
                                                    required
                                                    className="pro-input"
                                                    style={{ padding: '6px' }}
                                                />
                                            </div>

                                            <button type="submit" disabled={subiendoDoc} className="pro-btn pro-btn-primary" style={{ height: '38px' }}>
                                                {subiendoDoc ? 'Subiendo...' : '⬆️ Subir Documento'}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* TABLA DE ARCHIVOS DEL EMPLEADO */}
                                {cargandoDocs ? (
                                    <div style={{ padding: '30px', textAlign: 'center', color: '#86868b', flexShrink: 0 }}>
                                        Cargando archivos del expediente...
                                    </div>
                                ) : documentosFiltrados.length === 0 ? (
                                    <div style={{ padding: '36px', textAlign: 'center', color: '#86868b', backgroundColor: '#f8fafc', borderRadius: '12px', flexShrink: 0 }}>
                                        No hay documentos registrados en esta categoría para <strong>{empleadoExpediente.NombreCompleto}</strong>.
                                    </div>
                                ) : (
                                    <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: '12px', flexShrink: 0 }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                                                    <th style={{ padding: '10px 12px' }}>Categoría</th>
                                                    <th style={{ padding: '10px 12px' }}>Documento / Curso / Permiso</th>
                                                    <th style={{ padding: '10px 12px' }}>Fecha Emisión</th>
                                                    <th style={{ padding: '10px 12px' }}>Fin de Permiso / Vigencia (Manual)</th>
                                                    <th style={{ padding: '10px 12px' }}>Notas</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Visualizar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {documentosFiltrados.map((doc) => {
                                                    const hoy = new Date().toISOString().split('T')[0]
                                                    const fVenc = doc.FechaVencimiento ? String(doc.FechaVencimiento).split('T')[0] : ''
                                                    const vencido = fVenc && fVenc < hoy
                                                    const linkRaw = limpiarUrlTexto(doc.URL_SaaS || doc.ArchivoURL)
                                                    const estaActivoDoc = doc.Activo === undefined || doc.Activo === null ? true : Boolean(doc.Activo)

                                                    return (
                                                        <tr key={doc.DocumentoID} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', opacity: estaActivoDoc ? 1 : 0.6 }}>
                                                            <td style={{ padding: '10px 12px' }}>
                                                                <span className="pro-badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}>
                                                                    {doc.TipoDocumento}
                                                                </span>
                                                                {!estaActivoDoc && (
                                                                    <div style={{ fontSize: '10px', color: '#991b1b', fontWeight: 700, marginTop: '2px' }}>
                                                                        Archivado en DB
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1d1d1f' }}>
                                                                {doc.TituloDocumento}
                                                                {doc.NombreArchivo && (
                                                                    <div className="pro-mono" style={{ fontSize: '10.5px', color: '#86868b', fontWeight: 400 }}>
                                                                        📎 {doc.NombreArchivo}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="pro-mono" style={{ padding: '10px 12px' }}>
                                                                {doc.FechaDocumento ? String(doc.FechaDocumento).split('T')[0] : '—'}
                                                            </td>
                                                            <td style={{ padding: '10px 12px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                                    {puedeEditar ? (
                                                                        <input
                                                                            type="date"
                                                                            value={fVenc}
                                                                            onChange={(e) => actualizarFechaTerminoManual(doc.DocumentoID, e.target.value)}
                                                                            className="pro-input pro-mono"
                                                                            style={{ padding: '4px 8px', fontSize: '11.5px', width: '135px' }}
                                                                            title="Asignar o cambiar manualmente cuándo termina el permiso o curso"
                                                                        />
                                                                    ) : (
                                                                        <span className="pro-mono">{fVenc || 'Sin fecha límite'}</span>
                                                                    )}
                                                                    {fVenc && (
                                                                        <span
                                                                            className="pro-badge"
                                                                            style={{
                                                                                backgroundColor: vencido ? '#fef2f2' : '#ecfdf5',
                                                                                color: vencido ? '#991b1b' : '#065f46',
                                                                                fontSize: '10.5px'
                                                                            }}
                                                                        >
                                                                            {vencido ? '⚠️ Concluido' : '✓ Vigente'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '10px 12px', color: '#515154' }}>{doc.Notas || '—'}</td>
                                                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => abrirVisorCentrado(doc.TituloDocumento, linkRaw, doc.NombreArchivo)}
                                                                        className="pro-btn pro-btn-primary pro-btn-sm"
                                                                    >
                                                                        👁️ Ver Archivo
                                                                    </button>
                                                                    {puedeEditar && estaActivoDoc && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => ocultarDocumentoEnERP(doc.DocumentoID)}
                                                                            className="pro-btn pro-btn-danger pro-btn-sm"
                                                                            title="Quitar de la lista activa (se conserva en la base de datos)"
                                                                        >
                                                                            🗑️
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="pro-modal-footer" style={{ flexShrink: 0 }}>
                                <button type="button" onClick={() => setEmpleadoExpediente(null)} className="pro-btn pro-btn-primary">
                                    Cerrar Expediente
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {/* VISOR CENTRADO DE AZURE BLOB STORAGE */}
            {visorDocumento &&
                createPortal(
                    <div
                        className="pro-modal-backdrop"
                        style={{ zIndex: 99999 }}
                        onClick={() => setVisorDocumento(null)}
                    >
                        <div
                            className="pro-modal-window"
                            style={{
                                maxWidth: '960px',
                                width: '94vw',
                                height: '88vh',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="pro-modal-header" style={{ padding: '14px 22px' }}>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>📄</span>
                                        <span>{visorDocumento.titulo}</span>
                                    </h3>
                                    <span style={{ fontSize: '12px', color: '#86868b' }}>
                                        Visor Centrado de Azure Blob Storage
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <a
                                        href={visorDocumento.urlProxy}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="pro-btn pro-btn-primary pro-btn-sm"
                                        style={{ textDecoration: 'none' }}
                                    >
                                        ↗ Abrir en pestaña completa
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => setVisorDocumento(null)}
                                        className="pro-btn pro-btn-secondary pro-btn-sm"
                                    >
                                        ✕ Cerrar
                                    </button>
                                </div>
                            </div>

                            <div
                                style={{
                                    flex: 1,
                                    backgroundColor: '#323639',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'auto',
                                    padding: visorDocumento.esImagen ? '24px' : '0'
                                }}
                            >
                                {visorDocumento.esImagen ? (
                                    <img
                                        src={visorDocumento.urlProxy}
                                        alt={visorDocumento.titulo}
                                        onError={(e) => {
                                            if (visorDocumento.urlDirecta && e.currentTarget.src !== visorDocumento.urlDirecta) {
                                                e.currentTarget.src = visorDocumento.urlDirecta
                                            }
                                        }}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            objectFit: 'contain',
                                            borderRadius: '8px',
                                            backgroundColor: '#ffffff',
                                            boxShadow: '0 16px 40px rgba(0,0,0,0.45)'
                                        }}
                                    />
                                ) : (
                                    <iframe
                                        src={visorDocumento.urlProxy}
                                        title={visorDocumento.titulo}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            border: 'none',
                                            backgroundColor: '#ffffff'
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {/* MODAL DE ALTA / EDICIÓN / BAJA DE COLABORADOR + CONFIGURACIÓN KPI */}
            {modalEmpleado &&
                createPortal(
                    <div className="pro-modal-backdrop" onClick={() => setModalEmpleado(false)}>
                        <div className="pro-modal-window" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                            <div className="pro-modal-header">
                                <h3 style={{ fontSize: '16px', margin: 0 }}>
                                    {editandoId ? '✏️ Editar Expediente de Colaborador' : '➕ Registrar Nuevo Colaborador en RH'}
                                </h3>
                                <button onClick={() => setModalEmpleado(false)} className="pro-btn pro-btn-secondary pro-btn-sm">✕</button>
                            </div>

                            <form onSubmit={guardarEmpleado} className="pro-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label className="pro-label">Nombre Completo *</label>
                                        <input
                                            type="text"
                                            value={nombreCompleto}
                                            onChange={(e) => setNombreCompleto(e.target.value)}
                                            placeholder="Ej. Roberto Hernández López"
                                            required
                                            className="pro-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="pro-label">Fotografía de Perfil</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setArchivoFoto(e.target.files?.[0] || null)}
                                            className="pro-input"
                                            style={{ padding: '6px' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label className="pro-label">Teléfono</label>
                                        <input
                                            type="text"
                                            value={telefono}
                                            onChange={(e) => setTelefono(e.target.value)}
                                            placeholder="222-000-0000"
                                            className="pro-input pro-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="pro-label">Departamento *</label>
                                        <select value={departamento} onChange={(e) => setDepartamento(e.target.value)} className="pro-select">
                                            <option value="Operaciones">Operaciones / Planta</option>
                                            <option value="Ingeniería">Ingeniería CAD</option>
                                            <option value="Almacén">Almacén</option>
                                            <option value="Compras">Compras</option>
                                            <option value="Recursos Humanos">Recursos Humanos</option>
                                            <option value="Dirección">Dirección</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="pro-label">Puesto</label>
                                        <input
                                            type="text"
                                            value={puesto}
                                            onChange={(e) => setPuesto(e.target.value)}
                                            placeholder="Ej. Tornero CNC"
                                            className="pro-input"
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label className="pro-label">Fecha de Inicio (Ingreso) *</label>
                                        <input
                                            type="date"
                                            value={fechaInicio}
                                            onChange={(e) => setFechaInicio(e.target.value)}
                                            required
                                            className="pro-input pro-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="pro-label">Fecha de Nacimiento</label>
                                        <input
                                            type="date"
                                            value={fechaNacimiento}
                                            onChange={(e) => setFechaNacimiento(e.target.value)}
                                            className="pro-input pro-mono"
                                        />
                                    </div>
                                </div>

                                {/* CONFIGURACIÓN DE PARTICIPACIÓN Y FRECUENCIA DE KPIs */}
                                <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <strong style={{ fontSize: '13px', color: '#1e40af' }}>
                                                🎯 Aplica para Evaluación de KPIs ({departamento})
                                            </strong>
                                            <div style={{ fontSize: '11.5px', color: '#475569' }}>
                                                Define si este colaborador será evaluado en el módulo de rendimiento.
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={aplicaKPI}
                                            onChange={(e) => setAplicaKPI(e.target.checked)}
                                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                        />
                                    </div>

                                    {aplicaKPI && (
                                        <div>
                                            <label className="pro-label" style={{ fontSize: '11.5px' }}>Frecuencia de Evaluación Preferida</label>
                                            <select
                                                value={frecuenciaKpiPref}
                                                onChange={(e) => setFrecuenciaKpiPref(e.target.value)}
                                                className="pro-select"
                                            >
                                                <option value="SEMANAL">Semanal</option>
                                                <option value="MENSUAL">Mensual</option>
                                                <option value="BIMESTRAL">Bimestral</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* CONTROL DE ESTATUS ACTIVO / BAJA CON FECHA DE SALIDA */}
                                <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: activo ? '#ecfdf5' : '#fef2f2', border: '1px solid rgba(0,0,0,0.08)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <strong style={{ fontSize: '13px', color: activo ? '#065f46' : '#991b1b' }}>
                                                {activo ? '🟢 Colaborador Activo en Planta' : '🔴 Colaborador Dado de Baja (Inactivo)'}
                                            </strong>
                                            <div style={{ fontSize: '11.5px', color: '#515154' }}>
                                                {activo
                                                    ? 'Aparece disponible para préstamos de herramienta y entregas en almacén.'
                                                    : 'Oculto en almacén y operaciones futuras, pero su expediente permanece guardado.'}
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={activo}
                                            onChange={(e) => setActivo(e.target.checked)}
                                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                        />
                                    </div>

                                    {!activo && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '10px', marginTop: '12px' }}>
                                            <div>
                                                <label className="pro-label">Fecha de Salida / Baja *</label>
                                                <input
                                                    type="date"
                                                    value={fechaSalida}
                                                    onChange={(e) => setFechaSalida(e.target.value)}
                                                    required={!activo}
                                                    className="pro-input pro-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="pro-label">Motivo de Salida / Observaciones</label>
                                                <input
                                                    type="text"
                                                    value={motivoSalida}
                                                    onChange={(e) => setMotivoSalida(e.target.value)}
                                                    placeholder="Ej. Fin de contrato, renuncia voluntaria..."
                                                    className="pro-input"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pro-modal-footer" style={{ padding: '12px 0 0 0' }}>
                                    <button type="button" onClick={() => setModalEmpleado(false)} className="pro-btn pro-btn-secondary">
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={guardando} className="pro-btn pro-btn-primary">
                                        {guardando ? 'Guardando...' : '💾 Guardar Colaborador'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    )
}