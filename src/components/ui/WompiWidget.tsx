// src/components/WompiWidget.tsx
import React, { useEffect, useState } from 'react';
import { getSignature, createPendingInscription } from '../../data/wompiService';

interface WompiWidgetProps {
  amountInCents: number;
  formData: any;
  onTransactionSuccess?: (transaction: CheckoutResult['transaction']) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    WidgetCheckout: {
      new(config: WidgetCheckoutConfig): WidgetCheckoutInstance;
    };
  }
}

interface WidgetCheckoutConfig {
  currency: string;
  amountInCents: number;
  reference: string;
  publicKey: string;
  redirectUrl: string;
  'signature:integrity': string;
  // Configuraciones adicionales requeridas para sandbox
  sandbox?: boolean;
  onClose: () => void;
  onReady: () => void;
  onError: (error: unknown) => void;
}

interface WidgetCheckoutInstance {
  open: (callback: (result: CheckoutResult) => void) => void;
}

interface CheckoutResult {
  transaction?: {
    status: string;
    id: string;
    reference: string;
    [key: string]: any;
  };
  [key: string]: any;
}

const generateUniqueReference = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `ia_${timestamp}_${randomStr}`;
};

const WompiWidget: React.FC<WompiWidgetProps> = ({
  amountInCents,
  formData,
  onTransactionSuccess,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
  
  // Validación mejorada de variables de entorno
  const WOMPI_PUBLIC_KEY = import.meta.env.PUBLIC_WOMPI_PUBLIC_KEY as string;
  const ENVIRONMENT = import.meta.env.PUBLIC_ENVIRONMENT as string || 'development';
  
  // Validaciones críticas
  if (!WOMPI_PUBLIC_KEY || WOMPI_PUBLIC_KEY === 'undefined' || WOMPI_PUBLIC_KEY === undefined) {
    throw new Error('WOMPI_PUBLIC_KEY no está configurada correctamente en variables de entorno');
  }

  const isProduction = ENVIRONMENT === 'production';
  const isSandbox = !isProduction;
  
  console.log('🔧 Configuración Wompi:', {
    publicKey: WOMPI_PUBLIC_KEY, // Mostrar completo para debugging
    publicKeyValid: WOMPI_PUBLIC_KEY && WOMPI_PUBLIC_KEY.startsWith('pub_'),
    environment: ENVIRONMENT,
    isProduction,
    isSandbox,
    amountInCents
  });

  const initializePayment = async () => {
    try {
      setIsLoading(true);

      // Verificaciones previas mejoradas
      if (!scriptLoaded) {
        console.error('❌ Script de Wompi no está cargado');
        alert('Error: Widget de pago no disponible. Recarga la página.');
        return;
      }

      if (!window.WidgetCheckout) {
        console.error('❌ WidgetCheckout no disponible en window');
        alert('Error: Widget de pago no disponible. Recarga la página.');
        return;
      }

      if (typeof window.WidgetCheckout !== 'function') {
        console.error('❌ WidgetCheckout no es una función');
        alert('Error: Widget de pago no válido. Recarga la página.');
        return;
      }

      if (isNaN(amountInCents) || amountInCents <= 0) {
        console.error("❌ Monto inválido:", amountInCents);
        alert('Error: El monto no es válido');
        return;
      }

      // Validación adicional de la clave pública
      if (!WOMPI_PUBLIC_KEY || !WOMPI_PUBLIC_KEY.startsWith('pub_')) {
        console.error('❌ Clave pública inválida:', WOMPI_PUBLIC_KEY);
        alert('Error: Configuración de pago inválida');
        return;
      }

      const reference = generateUniqueReference();
      console.log('📝 Referencia generada:', reference);

      // Crear inscripción pendiente
      const payload = {
        ...formData,
        reference
      };

      console.log('🚀 Creando inscripción pendiente...');
      await createPendingInscription(payload);
      console.log('✅ Inscripción pendiente creada');

      // Obtener firma
      console.log('🔐 Obteniendo firma...');
      const signature = await getSignature(reference, amountInCents, 'COP');
      console.log('✅ Firma obtenida:', signature ? 'OK' : 'ERROR');

      if (!signature) {
        throw new Error('No se pudo obtener la firma de integridad');
      }

      // Configuración del widget con validaciones estrictas
      if (!WOMPI_PUBLIC_KEY.startsWith('pub_')) {
        throw new Error('Clave pública de Wompi inválida - debe comenzar con pub_');
      }

      // CRÍTICO: Según documentación oficial, sandbox debe configurarse explícitamente
      const isTestKey = WOMPI_PUBLIC_KEY.includes('test');
      
      const checkoutConfig: WidgetCheckoutConfig = {
        currency: 'COP',
        amountInCents,
        reference,
        publicKey: WOMPI_PUBLIC_KEY,
        redirectUrl: `${window.location.origin}/pago-exitoso`,
        'signature:integrity': signature,
        onClose: () => {
          console.log('🔒 Widget cerrado por el usuario');
          setIsLoading(false);
        },
        onReady: () => {
          console.log('✅ Widget listo para usar');
        },
        onError: (error: unknown) => {
          console.error('❌ Error en el widget:', error);
          setIsLoading(false);
          alert('Error en el widget de pago. Intenta nuevamente.');
        }
      };

      // FORZAR sandbox para claves de test según documentación oficial
      if (isTestKey) {
        (checkoutConfig as any).sandbox = true;
        console.log('🧪 Configurando widget en modo SANDBOX');
      }

      console.log('🎯 Configuración final del checkout:', {
        currency: checkoutConfig.currency,
        amountInCents: checkoutConfig.amountInCents,
        reference: checkoutConfig.reference,
        publicKey: WOMPI_PUBLIC_KEY, // Mostrar completo para debugging
        publicKeyLength: WOMPI_PUBLIC_KEY.length,
        publicKeyType: WOMPI_PUBLIC_KEY.includes('test') ? 'TEST/SANDBOX' : 'PRODUCTION',
        sandbox: (checkoutConfig as any).sandbox || false,
        hasSignature: !!checkoutConfig['signature:integrity'],
        signatureLength: signature.length
      });

      // DEBUG CRÍTICO: Verificar que no hay caracteres ocultos
      console.log('🔍 DEBUG CRÍTICO de la clave:');
      console.log('Clave raw:', JSON.stringify(WOMPI_PUBLIC_KEY));
      console.log('Clave bytes:', [...WOMPI_PUBLIC_KEY].map(c => c.charCodeAt(0)));
      console.log('Tiene caracteres no ASCII:', /[^\x20-\x7E]/.test(WOMPI_PUBLIC_KEY));
      
      // Limpiar la clave de posibles caracteres ocultos
      const cleanedPublicKey = WOMPI_PUBLIC_KEY.trim().replace(/[^\w]/g, (match) => {
        if (match === '_') return '_';
        console.warn('Caracter sospechoso encontrado:', match.charCodeAt(0));
        return '';
      });
      
      if (cleanedPublicKey !== WOMPI_PUBLIC_KEY) {
        console.error('⚠️ La clave tenía caracteres extraños, usando versión limpia');
        console.log('Original:', JSON.stringify(WOMPI_PUBLIC_KEY));
        console.log('Limpia:', JSON.stringify(cleanedPublicKey));
      }

      // Usar la clave limpia
      checkoutConfig.publicKey = cleanedPublicKey;

      // Verificación final antes de crear el widget
      if (typeof window.WidgetCheckout !== 'function') {
        throw new Error('WidgetCheckout no es una función válida');
      }

      console.log('🚀 Creando instancia del widget...');
      const checkout = new window.WidgetCheckout(checkoutConfig);

      if (!checkout || typeof checkout.open !== 'function') {
        throw new Error('No se pudo crear la instancia del widget correctamente');
      }

      console.log('✅ Widget creado exitosamente, abriendo...');

      checkout.open(async (result: CheckoutResult) => {
        console.log('📦 Resultado completo del checkout:', result);
        
        if (!result || !result.transaction) {
          console.error("❌ Resultado inválido:", result);
          alert('Error: No se recibió información válida de la transacción');
          setIsLoading(false);
          return;
        }

        const { transaction } = result;
        console.log("💳 Transacción recibida:", {
          id: transaction.id,
          status: transaction.status,
          reference: transaction.reference
        });

        switch (transaction.status) {
          case "APPROVED":
            console.log("✅ ¡Pago exitoso!");
            if (onTransactionSuccess) {
              onTransactionSuccess(transaction);
            }
            // Redirección con pequeño delay para asegurar que el callback se ejecute
            setTimeout(() => {
              window.location.href = `${window.location.origin}/pago-exitoso?ref=${transaction.reference}`;
            }, 500);
            break;
            
          case "DECLINED":
            console.error("❌ Pago rechazado:", transaction);
            alert('El pago fue rechazado. Verifica tu información e intenta nuevamente.');
            break;
            
          case "PENDING":
            console.log("⏳ Pago pendiente:", transaction);
            alert('Tu pago está siendo procesado. Recibirás una notificación cuando se complete.');
            break;
            
          default:
            console.log("❓ Estado desconocido:", transaction.status);
            alert('Estado de pago desconocido. Contacta con soporte si el problema persiste.');
        }
        
        setIsLoading(false);
      });

    } catch (error) {
      console.error('💥 Error crítico al iniciar el pago:', error);
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Error desconocido al procesar el pago');
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Verificar si el script ya está cargado
    const existingScript = document.querySelector('script[src="https://checkout.wompi.co/widget.js"]');
    
    if (existingScript) {
      console.log('📜 Script de Wompi ya existe');
      // Verificar si el widget está disponible
      const checkWidget = () => {
        if (window.WidgetCheckout) {
          console.log('✅ WidgetCheckout disponible');
          setScriptLoaded(true);
        } else {
          console.log('⏳ Esperando WidgetCheckout...');
          setTimeout(checkWidget, 100);
        }
      };
      checkWidget();
      return;
    }

    console.log('📜 Cargando script de Wompi...');
    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Script de Wompi cargado exitosamente');
      // Esperar un poco para que el widget se inicialice
      setTimeout(() => {
        if (window.WidgetCheckout) {
          console.log('✅ WidgetCheckout disponible');
          setScriptLoaded(true);
        } else {
          console.error('❌ WidgetCheckout no disponible después de cargar el script');
        }
      }, 100);
    };
    
    script.onerror = () => {
      console.error('❌ Error cargando script de Wompi');
      alert('Error: No se pudo cargar el widget de pago');
    };
    
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
        setScriptLoaded(false);
      }
    };
  }, []);

  const buttonText = () => {
    if (isLoading) return 'Procesando pago...';
    if (!scriptLoaded) return 'Cargando widget...';
    if (!WOMPI_PUBLIC_KEY || !WOMPI_PUBLIC_KEY.startsWith('pub_')) return 'Error de configuración';
    return 'Pagar Ahora con Wompi';
  };

  const isButtonDisabled = disabled || isLoading || !scriptLoaded || !WOMPI_PUBLIC_KEY || !WOMPI_PUBLIC_KEY.startsWith('pub_');

  return (
    <button
      onClick={initializePayment}
      disabled={isButtonDisabled}
      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 
                 hover:to-blue-700 text-white px-8 py-4 rounded-lg font-medium 
                 transition-all transform hover:scale-105 disabled:opacity-50 
                 disabled:cursor-not-allowed disabled:hover:scale-100"
    >
      {buttonText()}
    </button>
  );
};

export default WompiWidget;