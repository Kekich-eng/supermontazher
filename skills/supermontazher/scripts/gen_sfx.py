"""Синтезирует звуки интерфейса для ролика (свои, без чужих прав). Запуск: python gen_sfx.py"""
import wave
import numpy as np

SR = 48000


def save(name, x, peak=0.5):
    x = x / (np.abs(x).max() + 1e-9) * peak
    fade = int(0.004 * SR)
    x[:fade] *= np.linspace(0, 1, fade)
    x[-fade:] *= np.linspace(1, 0, fade)
    with wave.open(f"public/sfx/{name}.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


def t(sec):
    return np.arange(int(sec * SR)) / SR


def sweep(f0, f1, sec):
    x = t(sec)
    f = f0 * (f1 / f0) ** (x / sec)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


# pop — мягкий «бульк» на появление карточки
x = t(0.13)
save("pop", sweep(380, 760, 0.13) * np.exp(-x * 26) + 0.25 * sweep(760, 1500, 0.13) * np.exp(-x * 40), 0.45)

# whoosh — короткий «вжух» на вылет крупного блока
x = t(0.34)
rng = np.random.default_rng(7)
noise = rng.standard_normal(len(x))
k = np.exp(-np.arange(400) / 60.0); k /= k.sum()          # сглаживаем шум — убираем шипение
low = np.convolve(noise, k, mode="same")
env = np.sin(np.pi * x / 0.34) ** 2
save("whoosh", low * env * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * x)), 0.32)

# ding — «дзынь» на важную цифру
x = t(0.9)
bell = (np.sin(2 * np.pi * 1318.5 * x) + 0.5 * np.sin(2 * np.pi * 1975.5 * x) + 0.25 * np.sin(2 * np.pi * 2637 * x)) * np.exp(-x * 6.5)
save("ding", bell, 0.4)

# tick — тихий щелчок на мелкие появления
x = t(0.05)
save("tick", np.sin(2 * np.pi * 1700 * x) * np.exp(-x * 110), 0.3)

# swap — «блип» на замену слова
x = t(0.2)
save("swap", np.concatenate([sweep(900, 520, 0.09), sweep(520, 1040, 0.11)]) * np.exp(-x * 9), 0.4)

# alert — два низких тона на предупреждение
x = t(0.16)
tone = lambda f: np.sin(2 * np.pi * f * x) * np.exp(-x * 14)
save("alert", np.concatenate([tone(440), tone(370)]), 0.42)
print("ok")
