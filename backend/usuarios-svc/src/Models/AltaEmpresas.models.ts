import mongoose, { Mongoose } from "mongoose";




//SubSchema de Licencias
const LicenciaSchema = new mongoose.Schema({
    fecha_inicio: { type: Date, required: true },
    fecha_fin: { type: Date },
   estado: { type: Boolean, default: true},
  
  // Agregamos el campo para el tipo de plan
  plan: { 
    type: String, 
    required: true,
    enum: ['Mensual', 'Anual', 'Trimestral'] // Restringe los valores posibles
  },
  
  renovado: { type: Boolean, default: false }
});

// Middleware (Gancho) que se ejecuta antes de guardar el documento
LicenciaSchema.pre('save', function(next) {
  // Solo si el documento es nuevo o si la fecha de fin no ha sido asignada
  if (!this.fecha_fin) {
    let endDate = new Date(this.fecha_inicio);
    
    switch (this.plan) {
      case 'Mensual':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'Anual':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case 'Trimestral':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      // Puedes agregar más casos según tus planes
      default:
        // Si no es un plan con fecha fija, no hacemos nada
        break;
    }
    
    this.fecha_fin = endDate;
  }
  next(); // Continúa el proceso de guardar
});

//Sub-esquema de contratantes

const ContratanteSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    correo: { type: String, required: true },
    telefono: { type: String },
    ext: { type: String },
    puesto: { type: String },
    creado: { type: Date, default: Date.now }
});

//Esquema principal de Empresa
const EmpresaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    rfc: { type: String, required: true, unique: true },
    direccion: { type: String },
    telefono: { type: String },
    correo: { type: String, required: true, unique: true },
    codigo_acceso: { type: String, required: true, unique: true },
    activo: { type: Boolean, default: true },
    creado: { type: Date, default: Date.now },
    actualizado: { type: Date, default: Date.now },
    baja: { type: Date },
    licencia: [LicenciaSchema],
    contratantes: [ContratanteSchema] // Array de subdocumentos de contratantes
});

export const Empresa = mongoose.model('Empresa', EmpresaSchema);