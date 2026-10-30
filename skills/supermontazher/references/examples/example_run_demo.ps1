# Открывает Claude Code через Free Claude Code в папке klodfree и сразу даёт ему задачу.
# Нужен для записи ролика: окно видимое, всё происходит на экране.
$folder = Join-Path $env:USERPROFILE "Desktop\klodfree"
Set-Location -LiteralPath $folder
$Host.UI.RawUI.WindowTitle = "Free Claude Code"

# крупный шрифт только для этого окна (обычные окна PowerShell не затрагивает)
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class ConFont {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CONSOLE_FONT_INFOEX {
        public uint cbSize; public uint nFont; public short X; public short Y;
        public int FontFamily; public int FontWeight;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string FaceName;
    }
    [DllImport("kernel32.dll", SetLastError = true)] static extern IntPtr GetStdHandle(int n);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool SetCurrentConsoleFontEx(IntPtr h, bool max, ref CONSOLE_FONT_INFOEX f);
    public static bool Set(string face, short size) {
        var f = new CONSOLE_FONT_INFOEX();
        f.cbSize = (uint)Marshal.SizeOf(f); f.X = 0; f.Y = size; f.FontFamily = 54; f.FontWeight = 400; f.FaceName = face;
        return SetCurrentConsoleFontEx(GetStdHandle(-11), false, ref f);
    }
}
"@
[void][ConFont]::Set("Consolas", 30)
Clear-Host

# окно запущено из сессии Claude: убираем её служебные переменные, иначе в кадре появляются лишние предупреждения
$names = @(Get-ChildItem Env: | Where-Object { $_.Name -match '^(CLAUDE_CODE_|CLAUDECODE|CLAUDE_AGENT_|ANTHROPIC_)' } | ForEach-Object { $_.Name })
foreach ($n in $names) { Remove-Item "Env:$n" -ErrorAction SilentlyContinue }

# отдельная папка настроек: демонстрация не трогает настоящий Claude Code и не просит входа в аккаунт
$env:CLAUDE_CONFIG_DIR = Join-Path $env:USERPROFILE ".fcc-demo-claude"

# показываем на экране ту же команду, которую зритель наберёт сам
Write-Host "PS $folder> " -NoNewline
Write-Host "fcc-claude" -ForegroundColor Yellow
Start-Sleep -Seconds 2

$task = "Сделай калькулятор калорий одним файлом index.html. Тёмное оформление, на русском."
fcc-claude --permission-mode acceptEdits $task