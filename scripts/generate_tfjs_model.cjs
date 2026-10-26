const tf = require('@tensorflow/tfjs');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('[INFO] Construyendo arquitectura de red neuronal para postura de guantes...');
  
  const model = tf.sequential();
  model.add(tf.layers.dense({
    inputShape: [79],
    units: 128,
    activation: 'relu',
    name: 'capa_densa_128'
  }));
  model.add(tf.layers.dropout({ rate: 0.3, name: 'dropout_1' }));
  model.add(tf.layers.dense({
    units: 64,
    activation: 'relu',
    name: 'capa_densa_64'
  }));
  model.add(tf.layers.dropout({ rate: 0.3, name: 'dropout_2' }));
  model.add(tf.layers.dense({
    units: 9,
    activation: 'softmax',
    name: 'probabilidades_clases'
  }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  console.log('[INFO] Calibrando pesos iniciales con datos sintéticos...');
  // Generar datos sintéticos de calibración (180 muestras x 79 características, 9 clases one-hot)
  const numMuestras = 180;
  const xsData = [];
  const ysData = [];

  for (let i = 0; i < numMuestras; i++) {
    const claseIdx = i % 9;
    const vector = new Array(79).fill(0).map(() => (Math.random() - 0.5) * 0.5);
    // Señal característica para la clase
    vector[claseIdx * 8] = 0.8;
    vector[claseIdx * 8 + 1] = 0.6;

    const oneHot = new Array(9).fill(0);
    oneHot[claseIdx] = 1;

    xsData.push(vector);
    ysData.push(oneHot);
  }

  const xs = tf.tensor2d(xsData, [numMuestras, 79]);
  const ys = tf.tensor2d(ysData, [numMuestras, 9]);

  await model.fit(xs, ys, {
    epochs: 15,
    batchSize: 32,
    verbose: 0
  });

  xs.dispose();
  ys.dispose();

  const outDir = path.resolve(__dirname, '../public/modelo_tfjs');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('[INFO] Exportando modelo a:', outDir);

  await model.save(tf.io.withSaveHandler(async (artifacts) => {
    const weightFileName = 'group1-shard1of1.bin';
    const weightBuffer = Buffer.from(artifacts.weightData);
    fs.writeFileSync(path.join(outDir, weightFileName), weightBuffer);

    const modelJSON = {
      format: 'layers-model',
      generatedBy: 'TensorFlow.js tfjs-core v' + tf.version.tfjs,
      convertedBy: null,
      modelTopology: artifacts.modelTopology,
      weightsManifest: [
        {
          paths: ['./' + weightFileName],
          weights: artifacts.weightSpecs
        }
      ]
    };

    fs.writeFileSync(path.join(outDir, 'model.json'), JSON.stringify(modelJSON, null, 2), 'utf-8');

    return {
      modelArtifactsInfo: {
        dateSaved: new Date(),
        modelTopologyType: 'JSON',
        weightDataBytes: weightBuffer.byteLength
      }
    };
  }));

  console.log('✅ Modelo TensorFlow.js exportado exitosamente:');
  console.log('   - model.json');
  console.log('   - group1-shard1of1.bin');
  console.log('   - labels.json');
}

main().catch((err) => {
  console.error('❌ Error generando modelo:', err);
  process.exit(1);
});
