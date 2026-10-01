// app.js - Gestor de Tareas Universitarias
// Lab 04: JavaScript ES6+, manipulación del DOM y eventos

const STORAGE_KEY = 'tareasUniversitarias';

/* ---------- Referencias al DOM ---------- */
const form = document.querySelector('#tarea-form');
const inputTitulo = document.querySelector('#titulo');
const inputCurso = document.querySelector('#curso');
const inputFecha = document.querySelector('#fechaEntrega');
const alertas = document.querySelector('#alertas');
const lista = document.querySelector('#lista-tareas');
const filtros = document.querySelector('#filtros');
const resumen = document.querySelector('#resumen');

/* ---------- Estado global ---------- */
// Arreglo de objetos: { id, titulo, curso, fechaEntrega, completada }
let tareas = [];
let filtroActual = 'todas';

/* ---------- Persistencia (localStorage) ---------- */
const cargarTareas = () => {
  try {
    const datos = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    console.warn('No se pudo leer localStorage:', error);
    return [];
  }
};

document.addEventListener('DOMContentLoaded', () => {
    tareas = cargarTareas();
    renderTareas();
})

const guardarTareas = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tareas));
  } catch (error) {
    console.warn('No se pudo guardar en localStorage:', error);
  }
};

/* ---------- Validación ---------- */
const obtenerErrores = ({ titulo, curso, fechaEntrega }) => {
  const errores = [];

  if (!titulo) errores.push('El título no puede estar vacío.');
  if (!curso) errores.push('El curso no puede estar vacío.');

  if (!fechaEntrega) {
    errores.push('Elige una fecha de entrega.');
  } else {
    // Se compara solo la fecha (sin hora): la entrega debe ser posterior a hoy
    const entrega = new Date(`${fechaEntrega}T00:00:00`);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (entrega <= hoy) {
      errores.push('La fecha de entrega debe ser posterior a la fecha actual.');
    }
  }

  return errores;
};

const mostrarErrores = (errores) => {
  alertas.replaceChildren();
  errores.forEach((mensaje) => {
    const div = document.createElement('div');
    div.className = 'alert alert-danger py-2 mb-2';
    div.textContent = mensaje; // textContent evita inyectar HTML
    alertas.appendChild(div);
  });
};

const limpiarErrores = () => alertas.replaceChildren();

/* ---------- Operaciones sobre el arreglo (map, filter, find, reduce) ---------- */
const agregarTarea = (datos) => {
  tareas = [...tareas, { id: Date.now(), ...datos, completada: false }];
};

const alternarTarea = (id) => {
  tareas = tareas.map((t) => (t.id === id ? { ...t, completada: !t.completada } : t));
};

const eliminarTarea = (id) => {
  tareas = tareas.filter((t) => t.id !== id);
};

const tareasFiltradas = () => {
  switch (filtroActual) {
    case 'pendientes':
      return tareas.filter((t) => !t.completada);
    case 'completadas':
      return tareas.filter((t) => t.completada);
    default:
      return tareas;
  }
};

/* ---------- Renderizado ---------- */
const formatearFecha = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const crearItem = ({ id, titulo, curso, fechaEntrega, completada }) => {
  const li = document.createElement('li');
  li.className = 'list-group-item d-flex align-items-center gap-3';
  li.dataset.id = id;
  if (completada) li.classList.add('tarea-completada');

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'form-check-input m-0';
  check.checked = completada;
  check.dataset.accion = 'alternar';
  check.setAttribute('aria-label', `Marcar "${titulo}" como completada`);

  const cuerpo = document.createElement('div');
  cuerpo.className = 'flex-grow-1';

  const tituloEl = document.createElement('div');
  tituloEl.className = 'tarea-titulo fw-semibold';
  tituloEl.textContent = titulo;

  const meta = document.createElement('div');
  meta.className = 'tarea-meta';
  meta.textContent = `${curso} · Entrega: ${formatearFecha(fechaEntrega)}`;

  cuerpo.append(tituloEl, meta);

  const btnEliminar = document.createElement('button');
  btnEliminar.type = 'button';
  btnEliminar.className = 'btn btn-danger btn-sm';
  btnEliminar.dataset.accion = 'eliminar';
  btnEliminar.textContent = 'Eliminar';

  li.append(check, cuerpo, btnEliminar);
  return li;
};

const actualizarResumen = () => {
  const { total, pendientes } = tareas.reduce(
    (acc, t) => ({
      total: acc.total + 1,
      pendientes: acc.pendientes + (t.completada ? 0 : 1),
    }),
    { total: 0, pendientes: 0 }
  );
  resumen.textContent =
    total === 0
      ? 'Aún no tienes tareas registradas.'
      : `${pendientes} pendiente${pendientes === 1 ? '' : 's'} de ${total} tarea${total === 1 ? '' : 's'}.`;
};

const renderTareas = () => {
  lista.replaceChildren(); // evita duplicar elementos al volver a renderizar

  const visibles = tareasFiltradas();

  if (visibles.length === 0) {
    const vacio = document.createElement('li');
    vacio.className = 'list-group-item estado-vacio';
    vacio.textContent =
      tareas.length === 0
        ? 'Agrega tu primera tarea con el formulario de arriba.'
        : 'No hay tareas en este filtro.';
    lista.appendChild(vacio);
  } else {
    visibles.forEach((tarea) => lista.appendChild(crearItem(tarea)));
  }

  actualizarResumen();
};

/* ---------- Eventos ---------- */
// 1) Alta de tarea: submit + preventDefault + validación
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const datos = {
    titulo: inputTitulo.value.trim(),
    curso: inputCurso.value.trim(),
    fechaEntrega: inputFecha.value,
  };

  const errores = obtenerErrores(datos);
  if (errores.length > 0) {
    mostrarErrores(errores);
    return;
  }

  limpiarErrores();
  agregarTarea(datos);
  guardarTareas();
  form.reset();
  inputTitulo.focus();
  renderTareas();
});

// 2) Delegación de eventos: un único listener en la lista para alternar y eliminar
lista.addEventListener('click', (e) => {
  const control = e.target.closest('[data-accion]');
  if (!control) return;

  const item = control.closest('li[data-id]');
  if (!item) return;
  const id = Number(item.dataset.id);

  if (control.dataset.accion === 'alternar') alternarTarea(id);
  if (control.dataset.accion === 'eliminar') eliminarTarea(id);

  guardarTareas();
  renderTareas();
});

// 3) Filtro visual (Todas / Pendientes / Completadas)
filtros.addEventListener('click', (e) => {
  const boton = e.target.closest('[data-filtro]');
  if (!boton) return;

  filtroActual = boton.dataset.filtro;
  filtros
    .querySelectorAll('[data-filtro]')
    .forEach((b) => b.classList.toggle('active', b === boton));
  renderTareas();
});

// 4) Carga inicial desde localStorage
document.addEventListener('DOMContentLoaded', () => {
  tareas = cargarTareas();
  renderTareas();
});
