import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { IProducto, ICrearProductoDTO, IActualizarProductoDTO } from '../../models/iproducto';

@Component({
  selector: 'app-producto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './producto.html',
  styleUrl: './producto.css',
})
export class Producto implements OnInit {
  private productoService = inject(ProductoService)
  private fb = inject(FormBuilder)

  //signals de estado general
  productos = signal<IProducto[]>([])
  cargando = signal<boolean>(false)
  errorMensaje = signal<string | null>(null)

  //signal para filtros
  busqueda = signal<string>('')
  categoriaFiltro = signal<string>('')

  //signal para formularios y panel de control
  mostrarFormulario = signal<boolean>(false)
  modoEdicion = signal<boolean>(false)
  productoEditarId = signal<number | null>(null)

  // signal de paginacion
  paginaActual = signal<number>(1)
  itemsPorPagina = signal<number>(5)

  //formulario reactivo
  productoForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    descripcion: [''],
    precio: [0, [Validators.required, Validators.min(0)]],
    categoria: ['', [Validators.required]],
    disponibilidad: [true, [Validators.required]],
    stock: [0, [Validators.required, Validators.min(0)]]
  })

  //signal computada: filtra auto los productos segun busqueda, categoria
  productosFiltrados = computed(() => {
    const termino = this.busqueda().toLowerCase().trim();
    const cat = this.categoriaFiltro().toLowerCase().trim();

    return this.productos().filter(p => {
      const nombre = p.nombre.toLowerCase();
      const descripcion = (p.descripcion || '').toLowerCase();
      const categoria = p.categoria.toLowerCase();

      //1. coincidencia por texto (busca Nombre, descrip... o categoria)
      const coincideTexto =
      termino === '' ||
      nombre.includes(termino) ||
      descripcion.includes(termino) ||
      categoria.includes(termino);

      // 2. coincidencia por el selector de categoria
      const coincideCategoria = cat === '' || categoria === cat;

      return coincideTexto && coincideCategoria;
    })
  })

  ngOnInit(): void {
    this.cargarProductos()
  }

  cargarProductos(): void {
    this.cargando.set(true)
    this.errorMensaje.set(null)

    this.productoService.getProductos().subscribe({
      next: (data) => {
        this.productos.set(data)
        this.cargando.set(false)
      },
      error: () => {
        this.errorMensaje.set('No se pudo conectar con el servidor')
        this.cargando.set(false)
      }
    })
  }

  //metodo interaccion del panel de formulario
  abrirFormularioCrear(): void {
    this.modoEdicion.set(false);
    this.productoEditarId.set(null);
    this.productoForm.reset({
      nombre: '',
      descripcion: '',
      precio: 0,
      categoria: '',
      disponibilidad: true,
      stock: 0
    })
    this.mostrarFormulario.set(true)
  }

  abrirFormularioEditar(producto: IProducto): void {
    this.modoEdicion.set(true);
    this.productoEditarId.set(producto.id_producto!);
    this.productoForm.patchValue({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio,
      categoria: producto.categoria,
      disponibilidad: producto.disponibilidad,
      stock: producto.stock
    });
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
    this.productoForm.reset();
  }

  //guardar(crear o actualizar)
  guardarProducto(): void {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      return;
    }
    const formValues = this.productoForm.value;

    if (this.modoEdicion() && this.productoEditarId()) {
      //editar
      const dto: IActualizarProductoDTO = {
        ...formValues,
        disponibilidad: String(formValues.disponibilidad) === 'true' ||
          formValues.disponibilidad === true
      }

      this.productoService.actualizarProducto(this.productoEditarId()!, dto).subscribe({
        next: (productoActualizado) => {
          this.productos.update(lista =>
            lista.map(p => p.id_producto === productoActualizado.id_producto ? productoActualizado : p)
          )
          this.cerrarFormulario();
        },
        error: (err) => console.error('Error al actualizar', err)
      })
    } else {
      //crear
      const dto: ICrearProductoDTO = {
        ...formValues,
        disponibilidad: String(formValues.disponibilidad) === 'true' || formValues.disponibilidad === true
      }
      this.productoService.crearProducto(dto).subscribe({
        next: (nuevoProducto) => {
          this.productos.update(lista => [...lista, nuevoProducto]);
          this.cerrarFormulario();
        },
        error: (err) => console.error('Error al crear', err)
      })
    }
  }
  //eliminar
  eliminarProducto(id?: number): void {
    if (!id) return;

    if (!confirm('¡Estas seguro de que deseas eliminar este producto')) return;

    this.productoService.deleteProducto(id).subscribe({
      next: () => {
        this.productos.update(lista => lista.filter(p => p.id_producto !== id))
      },
      error: (err) => console.error('Error al eliminar', err)
    })
  }

  //eventos de inputs de busqueda
  onBusquedaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.busqueda.set(input.value);
    this.paginaActual.set(1); //resetear pagina
  }

  onCategoriaChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.categoriaFiltro.set(select.value)
    this.paginaActual.set(1);
  }

  //total paginas calculadas dinamicamente
  totalPaginas = computed(() => {
    return Math.ceil(this.productosFiltrados().length / this.itemsPorPagina()) || 1;
  })

  //array con los numeros de pagina 1,2,3,4
  paginasArray = computed(() => {
    return Array.from({ length: this.totalPaginas() }, (_, i) => i + 1);
  })

  //lista final recortada solo con los items de la pagina visible
  productosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina();
    const fin = inicio + this.itemsPorPagina();
    return this.productosFiltrados().slice(inicio, fin);
  })

  //metodo de navegacion
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina)
    }
  }

}
