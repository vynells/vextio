// Sets the Windows .exe icon and version details without needing Wine,
// so the installer can be built on any computer (including Linux CI).
const fs = require("fs");
const path = require("path");

exports.default = async function afterPack(ctx) {
  if (ctx.electronPlatformName !== "win32") return;
  const ResEdit = await import("resedit");
  const { NtExecutable, NtExecutableResource, Resource, Data } = ResEdit.default ?? ResEdit;
  const pkg = require("../package.json");
  const exe = path.join(ctx.appOutDir, `${ctx.packager.appInfo.productFilename}.exe`);
  const bin = NtExecutable.from(fs.readFileSync(exe), { ignoreCert: true });
  const res = NtExecutableResource.from(bin);

  const ico = Data.IconFile.from(fs.readFileSync(path.join(__dirname, "../build/icon.ico")));
  const groups = Resource.IconGroupEntry.fromEntries(res.entries);
  const id = groups.length ? groups[0].id : 1;
  const lang = groups.length ? groups[0].lang : 1033;
  Resource.IconGroupEntry.replaceIconsForResource(res.entries, id, lang, ico.icons.map((i) => i.data));

  const vi = Resource.VersionInfo.fromEntries(res.entries)[0] ?? Resource.VersionInfo.createEmpty();
  const [ma, mi, pa] = pkg.version.split(".").map(Number);
  vi.setFileVersion(ma, mi, pa, 0, 1033);
  vi.setProductVersion(ma, mi, pa, 0, 1033);
  vi.setStringValues({ lang: 1033, codepage: 1200 }, {
    FileDescription: "Vextio Orders",
    ProductName: "Vextio Orders",
    CompanyName: "Vextio",
    LegalCopyright: `© ${new Date().getFullYear()} Vextio`,
    OriginalFilename: "Vextio Orders.exe",
    InternalName: "Vextio Orders",
  });
  vi.outputToResourceEntries(res.entries);
  res.outputResource(bin);
  fs.writeFileSync(exe, Buffer.from(bin.generate()));
  console.log("  • set icon and version info on", path.basename(exe));
};
