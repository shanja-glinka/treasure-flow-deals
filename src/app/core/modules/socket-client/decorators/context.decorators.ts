import { applicationNamespace } from '../../../common/middlewares/cls.middleware';

/**
 * Декоратор создает новый контекст для работы рест функций.
 *
 * Алгоритм работы:
 * 1. Создает новый контекст CLS для выполнения обработчика с помощью `applicationNamespace.run()`.
 * 2. Внутри нового CLS-контекста:
 *    a. Если у сокета есть данные `clientWrap` (хранящиеся в `socket.data.clientWrap`),
 *       перебирает все пары ключ-значение и устанавливает их в текущий CLS-контекст через `this.cls.set(key, value)`.
 *    b. Вызывает оригинальный метод обработчика (с сохранением контекста `this` и переданных аргументов).
 *    c. Результат выполнения метода возвращается через resolve Promise.
 *
 * Примечания:
 * - Этот декоратор предполагает, что класс, в котором он применяется (например, гейтвей),
 *   имеет инжектированное свойство `cls` (экземпляр ClsServiceAdapter).
 * - Декоратор гарантирует, что обработчик выполняется в новом CLS-контексте, чтобы обеспечить изоляцию данных,
 *   установленных в `socket.data.clientWrap`.
 */
// eslint-disable-next-line
export function WithClientContext() {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Оборачиваем выполнение в новый контекст CLS
      return await new Promise((resolve, reject) => {
        applicationNamespace.run(async () => {
          try {
            // Ищем объект Socket (например, по наличию handshake)
            const socket = args.find((arg) => arg && arg.handshake);
            if (socket && socket.data && socket.data.clientWrap) {
              const clientWrap = socket.data.clientWrap;
              // Устанавливаем данные из clientWrap в CLS через this.cls
              for (const [key, value] of Object.entries(clientWrap)) {
                this.cls.set(key, value);
              }
            } else {
            }
            const result = await originalMethod.apply(this, args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    };
    return descriptor;
  };
}
