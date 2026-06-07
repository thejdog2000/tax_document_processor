# build_mac.spec — PyInstaller spec for Tax Document Processor (Mac)
# Produces a .app bundle in dist/

block_cipher = None

a = Analysis(
    ['app.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        ('25_1040.xlsx', '.'),
        ('2025_Tax_Return_Double_Check.xlsx', '.'),
    ],
    hiddenimports=[
        'boto3',
        'botocore',
        'openpyxl',
        'tkinterdnd2',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='TaxProcessor',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='TaxProcessor',
)

app = BUNDLE(
    coll,
    name='TaxProcessor.app',
    icon=None,
    bundle_identifier='com.firm.taxprocessor',
    info_plist={
        'NSHighResolutionCapable': True,
        'CFBundleShortVersionString': '1.0.0',
        'CFBundleName': 'Tax Document Processor',
    },
)
