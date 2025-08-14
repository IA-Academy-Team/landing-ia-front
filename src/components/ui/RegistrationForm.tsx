import { useState, useEffect } from 'react';
import WompiWidget from './WompiWidget';
import RegistrationSelector from './RegistrationSelector';

export default function RegistrationForm() {
  // Array de fechas disponibles - fácil de editar desde aquí
  const AVAILABLE_DATES = [
    { id: '2', date: 'Agenda Tu Fecha', location: 'Campuslands', value: '2025-08-15' },
    // { id: '3', date: '22 de marzo de 2025', location: 'Bucaramanga', value: '2025-03-22' },
    // { id: '4', date: '29 de marzo de 2025', location: 'Bucaramanga', value: '2025-03-29' }
  ];

  const [formType, setFormType] = useState<'individual' | 'multiple'>('individual');
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    email: '',
    phone: '',
    document: '',
    numSeats: '1',
    targetDate: '' // Campo para la fecha seleccionada del curso
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [maxSeatsError, setMaxSeatsError] = useState(false);
  const [minSeatsError, setMinSeatsError] = useState(false);
  const [success, setSuccess] = useState(false);

  // Precios
  const INDIVIDUAL_PRICE = 150000;
  const BULK_DISCOUNT_PRICE = 120000; // Precio por persona al comprar más de 40 cupos
  const BULK_DISCOUNT_THRESHOLD = 30;
  const MAX_SEATS = 500;
  const MIN_MULTIPLE_SEATS = 2;

  const resetForm = () => {
    setFormData({
      name: '',
      lastname: '',
      email: '',
      phone: '',
      document: '',
      numSeats: formType === 'individual' ? '1' : MIN_MULTIPLE_SEATS.toString(),
      targetDate: ''
    });
  };

  // Actualizar el valor de cupos al cambiar entre individual y múltiple
  useEffect(() => {
    if (formType === 'individual') {
      setFormData(prev => ({ ...prev, numSeats: '1' }));
    } else {
      // Si cambia a múltiple y el valor es menor que el mínimo, actualizarlo
      const currentSeats = Number(formData.numSeats);
      if (currentSeats < MIN_MULTIPLE_SEATS) {
        setFormData(prev => ({ ...prev, numSeats: MIN_MULTIPLE_SEATS.toString() }));
      }
    }
  }, [formType]);

  const handlePaymentSuccess = async (transaction: any) => {
    try {
      setIsSubmitting(true);
      setError('');
      setSuccess(false);
      console.log("Transacción exitosa:", transaction);
      setSuccess(true);
      resetForm();
    } catch (err) {
      console.error('Error:', err);
      setError('Error al procesar el pago. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = () => {
    const seats = Number(formData.numSeats) || 0;
    if (seats >= BULK_DISCOUNT_THRESHOLD) {
      return seats * BULK_DISCOUNT_PRICE;
    }
    return seats * INDIVIDUAL_PRICE;
  };

  const getUnitPrice = () => {
    const seats = Number(formData.numSeats) || 0;
    return seats >= BULK_DISCOUNT_THRESHOLD ? BULK_DISCOUNT_PRICE : INDIVIDUAL_PRICE;
  };

  const getAmountInCents = () => {
    return formType === 'individual'
      ? INDIVIDUAL_PRICE * 100
      : calculateTotal() * 100;
  };

  const isFormValid =
    formType === 'individual'
      ? Object.values(formData).slice(0, 5).every(value => value.trim().length > 0) && formData.targetDate !== ''
      : formData.name.trim().length > 0 &&
      formData.lastname.trim().length > 0 &&
      formData.email.trim().length > 0 &&
      formData.phone.trim().length > 0 &&
      Number(formData.numSeats) >= MIN_MULTIPLE_SEATS &&
      formData.targetDate !== '';

  // Obtener la fecha seleccionada para mostrar en el resumen
  const getSelectedDateText = () => {
    const selectedDate = AVAILABLE_DATES.find(d => d.value === formData.targetDate);
    return selectedDate ? `${selectedDate.date} - ${selectedDate.location}` : '—';
  };

  return (
    <form className={`mx-auto ${formType === 'multiple' ? 'max-w-5xl' : 'max-w-md'}`}>
      <div className={`${formType === 'multiple' ? 'flex flex-col md:flex-row gap-6' : ''}`}>
        <div className={`space-y-6 bg-white/5 p-8 rounded-xl border border-purple-500/20 ${formType === 'multiple' ? 'md:w-3/5' : 'w-full'}`}>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Inscríbete Ahora</h3>
            <p className="text-purple-300">Completa los datos y Realiza el pago</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded-lg mb-6">
              ¡Registro completado con éxito! Redirigiendo a WhatsApp...
            </div>
          )}

          {/* Selector de tipo de inscripción */}
          <RegistrationSelector formType={formType} setFormType={setFormType} />

          {/* Campo de selección de fecha para ambos formularios */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80">¿Qué fecha seleccionas?</label>
            <select
              name="targetDate"
              value={formData.targetDate}
              onChange={e => {
                const selectedOption = AVAILABLE_DATES.find(d => d.value === e.target.value);
                setFormData({ ...formData, targetDate: selectedOption ? selectedOption.value : '' });
              }}
              required
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-white/5 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={{ color: formData.targetDate === '' ? '#9ca3af' : 'white' }}
            >
              <option value="" disabled style={{ color: '#6b7280', backgroundColor: '#1e1e2f' }}>Selecciona una fecha</option>
              {AVAILABLE_DATES.map(dateOption => (
                <option 
                  key={dateOption.id} 
                  value={dateOption.value}
                  style={{ color: 'white', backgroundColor: '#1e1e2f' }}
                >
                  {dateOption.date} - {dateOption.location}
                </option>
              ))}
            </select>
            {formData.targetDate === '' && (
              <p className="text-purple-400 text-sm mt-1">Por favor selecciona una fecha para continuar</p>
            )}
          </div>

          {/* Formulario para inscripción individual */}
          {formType === 'individual' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/80">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isSubmitting}
                    placeholder="Ej: Juan"
                    className="w-full px-4 py-3 bg-white/5 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/80">Apellido</label>
                  <input
                    type="text"
                    name="lastname"
                    value={formData.lastname}
                    onChange={e => setFormData({ ...formData, lastname: e.target.value })}
                    required
                    disabled={isSubmitting}
                    placeholder="Ej: Pérez"
                    className="w-full px-4 py-3 bg-white/5 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              {[
                { label: 'Email', name: 'email', type: 'email', placeholder: 'correo@ejemplo.com' },
                { label: 'Celular', name: 'phone', type: 'tel', placeholder: '+57 300 123 4567' },
                { label: 'Número de documento', name: 'document', type: 'text', placeholder: 'Tu número de cédula' }
              ].map(field => (
                <div key={field.name} className="space-y-2">
                  <label className="block text-sm font-medium text-white/80">{field.label}</label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                    required
                    disabled={isSubmitting}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 bg-white/5 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              ))}
            </>
          )}

          {/* Formulario para inscripción múltiple */}
          {formType === 'multiple' && (
            <>
              {[
                { label: 'Nombre de la empresa/organización', name: 'lastname', placeholder: 'Ej: Tech Solutions' },
                { label: 'NIT', name: 'document', placeholder: 'Ej: 900.123.456-7' },
                { label: 'Representante', name: 'name', placeholder: 'Ej: María López' },
                { label: 'Email de contacto', name: 'email', type: 'email', placeholder: 'correo@ejemplo.com' },
                { label: 'Celular de contacto', name: 'phone', placeholder: '+57 300 123 4567' },
                { label: 'Cantidad de cupos', name: 'numSeats', placeholder: 'Ej: 10', type: 'number' }
              ].map(field => (
                <div key={field.name} className="space-y-2">
                  <label className="block text-sm font-medium text-white/80">{field.label}</label>
                  <input
                    type={field.type || 'text'}
                    name={field.name}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={e => {
                      if (field.name === 'numSeats') {
                        // Solo permitir números
                        const numericValue = e.target.value.replace(/\D/g, '');
                        
                        // Verificar si el valor es cero o contiene solo ceros
                        const isAllZeros = /^0+$/.test(numericValue);
                        const isEmpty = numericValue === '';
                        
                        // Manejar casos especiales: valor vacío o solo ceros
                        if (isEmpty || isAllZeros) {
                          setFormData({ ...formData, [field.name]: '' });
                          setMaxSeatsError(false);
                          setMinSeatsError(true);
                          return;
                        }
                        
                        // Quitar ceros iniciales (001 -> 1)
                        const cleanedValue = numericValue.replace(/^0+/, '');
                        
                        // Verificar si el valor excede el máximo permitido o es menor que el mínimo
                        const numValue = parseInt(cleanedValue);
                        if (numValue > MAX_SEATS) {
                          setMaxSeatsError(true);
                          setMinSeatsError(false);
                          setFormData({ ...formData, [field.name]: MAX_SEATS.toString() });
                        } else if (numValue < MIN_MULTIPLE_SEATS) {
                          // Mostrar error para valor menor que el mínimo pero mantener lo que escribió el usuario
                          setFormData({ ...formData, [field.name]: cleanedValue });
                          setMaxSeatsError(false);
                          setMinSeatsError(true);
                        } else {
                          setMaxSeatsError(false);
                          setMinSeatsError(false);
                          setFormData({ ...formData, [field.name]: cleanedValue });
                        }
                      } else {
                        setFormData({ ...formData, [field.name]: e.target.value });
                      }
                    }}
                    onKeyDown={e => {
                      if (field.name === 'numSeats') {
                        // Permitir solo teclas numéricas, borrar, tab, enter, flechas
                        const allowedKeys = ['Backspace', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Delete'];
                        const isNumericKey = /^[0-9]$/.test(e.key);
                        
                        if (!isNumericKey && !allowedKeys.includes(e.key)) {
                          e.preventDefault();
                        }
                      }
                    }}
                    required
                    disabled={isSubmitting}
                    placeholder={field.name === 'numSeats' ? `Mínimo ${MIN_MULTIPLE_SEATS}` : field.placeholder}
                    min={field.name === 'numSeats' ? MIN_MULTIPLE_SEATS.toString() : undefined}
                    max={field.name === 'numSeats' ? MAX_SEATS.toString() : undefined}
                    step={field.name === 'numSeats' ? '1' : undefined}
                    inputMode={field.name === 'numSeats' ? 'numeric' : undefined}
                    className="w-full px-4 py-3 bg-white/5 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {field.name === 'numSeats' && (
                    <>
                      {maxSeatsError && (
                        <div className="text-red-400 text-sm mt-1">
                          El máximo número de cupos permitido es {MAX_SEATS}.
                        </div>
                      )}
                      {minSeatsError && (
                        <div className="text-purple-500 text-sm mt-1">
                          Para empresas, debes ingresar al menos {MIN_MULTIPLE_SEATS} cupos.
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Botón de pago solo para individual o mensaje de completar datos */}
          {formType === 'individual' && (
            isFormValid ? (
              <WompiWidget
                amountInCents={INDIVIDUAL_PRICE * 100}
                formData={formData}
                onTransactionSuccess={(transaction) => handlePaymentSuccess(transaction)}
                disabled={isSubmitting}
              />
            ) : (
              <button disabled className="w-full bg-purple-600 text-white px-8 py-4 rounded-lg opacity-50">
                Completa tus datos para pagar
              </button>
            )
          )}
        </div>

        {/* Panel de resumen para compras múltiples */}
        {formType === 'multiple' && (
          <div className="md:w-2/5 space-y-6 bg-white/5 p-8 rounded-xl border border-purple-500/20 h-fit sticky top-4">
            <h3 className="text-xl font-bold text-white mb-4">Resumen de Compra</h3>

            <div className="space-y-4">
              <div className="flex justify-between text-white/80">
                <span>Empresa:</span>
                <span className="font-medium text-white">{formData.lastname || '—'}</span>
              </div>

              <div className="flex justify-between text-white/80">
                <span>Representante:</span>
                <span className="font-medium text-white">{formData.name || '—'}</span>
              </div>

              <div className="flex justify-between text-white/80">
                <span>Fecha seleccionada:</span>
                <span className="font-medium text-white">{getSelectedDateText()}</span>
              </div>

              <div className="flex justify-between text-white/80">
                <span>Cantidad de cupos:</span>
                <span className="font-medium text-white">{formData.numSeats || '0'}</span>
              </div>

              <div className="flex justify-between text-white/80">
                <span>Precio por cupo:</span>
                <span className="font-medium text-white">
                  ${getUnitPrice().toLocaleString('es-CO')}
                  {Number(formData.numSeats) >= BULK_DISCOUNT_THRESHOLD && (
                    <span className="ml-2 text-green-400 text-sm">
                      ¡Precio especial!
                    </span>
                  )}
                </span>
              </div>

              <div className="h-px bg-purple-500/20 my-4"></div>

              <div className="flex justify-between text-lg">
                <span className="text-white/80">Total a pagar:</span>
                <span className="font-bold text-white">
                  ${calculateTotal().toLocaleString('es-CO')}
                </span>
              </div>

              {/* Mensaje de promoción */}
              <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4 mt-6">
                <p className="text-purple-300 text-sm">
                  <span className="font-bold">¡Oferta especial!</span> Al comprar más de {BULK_DISCOUNT_THRESHOLD} cupos,
                  el precio por persona baja a ${BULK_DISCOUNT_PRICE.toLocaleString('es-CO')}
                </p>
              </div>

              {/* Botón de pago o mensaje de completar datos */}
              {isFormValid ? (
                <WompiWidget
                  amountInCents={getAmountInCents()}
                  formData={formData}
                  onTransactionSuccess={(transaction) => handlePaymentSuccess(transaction)}
                  disabled={isSubmitting}
                />
              ) : (
                <button disabled className="w-full bg-purple-600 text-white px-8 py-4 rounded-lg opacity-50 mt-6">
                  Completa tus datos para pagar
                </button>
              )}

              <p className="text-[#bcafbd] text-sm text-center mt-4">
                Una vez completes el pago, te contactaremos para gestionar los datos de tu equipo.
              </p>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}