async function pack() {
  try {
    console.log('Creating portable executable...');
    const { packager } = await import('@electron/packager');
    const appPaths = await packager({
      dir: '.',
      platform: 'win32',
      arch: 'x64',
      out: 'dist',
      overwrite: true,
      prune: true,
      icon: 'build/icon.png'
    });
    console.log('SUCCESS: Portable executable created');
    console.log('Location:', appPaths[0]);
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
}

pack();
