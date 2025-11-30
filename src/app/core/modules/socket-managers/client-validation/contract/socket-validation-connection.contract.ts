export interface ISocketValidationConnectionClient {
  userId: string;
  socketId: string;
  payload?: any;
  roomFilerId?: string;
}

export interface ISocketValidationConnectionRepository {
  /**
   * Регистрирует клиента для валидации
   * @param client - объект с данными пользователя, сокета и полезной нагрузкой
   * @param validationInterval - интервал валидации в миллисекундах
   * @param validationCallback - функция валидации, которая будет вызываться периодически
   * @param onInvalidCallback - функция, вызываемая для каждого сокета пользователя при неудачной валидации
   */
  registerForValidation(
    client: ISocketValidationConnectionClient,
    validationInterval: number,
    validationCallback: () => Promise<boolean>,
    onInvalidCallback: () => void,
  ): void;

  /**
   * Отменяет регистрацию клиента для валидации
   * @param socketId - ID сокета
   */
  unregisterFromValidation(socketId: string): void;
}
