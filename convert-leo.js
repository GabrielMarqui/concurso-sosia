const { Jimp } = require('jimp');

async function convertLeo() {
  try {
    const img = await Jimp.read('./public/leo.jpg');
    const threshold = 45;

    img.scan(0, 0, img.bitmap.width, img.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      if (r < threshold && g < threshold && b < threshold) {
        this.bitmap.data[idx + 3] = 0; // alpha = 0 (transparente)
      }
    });

    await img.write('./public/leo.png');
    console.log('leo.png criado com sucesso com fundo transparente!');
  } catch (err) {
    console.error('Erro:', err.message);
    console.error(err.stack);
  }
}

convertLeo();
