import * as fs from 'fs';

export async function unlockFile(path: string): Promise<void> {
  try {
    const fd = await fs.promises.open(path, 'r');
    await fd.close(); // Принудительно закрываем дескриптор

    // const readStream = fs.createReadStream(path);
    // // Освобождение потока
    // await readStream.close();
  } catch (error) {
    console.error(`Ошибка при разблокировке файла ${path}: ${error.message}`);
  }
}
