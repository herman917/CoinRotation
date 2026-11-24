Build a clean, intuitive, single-page interactive web app (`index.html`, `style.css`, `app.js`) demonstrating the **Coin Rotation Paradox** using HTML5 Canvas and vanilla JavaScript. Keep the UI simple, focused, and responsive with Traditional Chinese labels.

### 1. Coin Selection & Real Proportions
Provide two dropdown selectors (or button groups): one for the **Stationary Center Coin (中間固定硬幣)** and one for the **Rolling Outer Coin (外圍滾動硬幣)**. Both default to **10元硬幣 (NT$10 Coin)**.

Use the NT$10 coin as the base unit (`R_base = 80px`, representing 26mm diameter) and support these exact 6 options for both coins:
1. **10元硬幣 (NT$10 - Default)**: `1.0x` base size (26mm, silver/nickel color with portrait silhouette & "10" label)
2. **5元硬幣 (NT$5)**: `22 / 26 ≈ 0.846x` base size (22mm, silver color with "5" label)
3. **1元硬幣 (NT$1)**: `20 / 26 ≈ 0.769x` base size (20mm, bronze/copper color with "1" label)
4. **虛擬小幣 (1/2 半徑)**: `0.5x` base size (half the radius of NT$10, cyan/blue coin design with "0.5x" label)
5. **虛擬大幣 (大一倍 / 2倍半徑)**: `2.0x` base size (twice the radius of NT$10, gold coin design with "2x" label)
6. **虛擬巨幣 (大兩倍 / 3倍半徑)**: `3.0x` base size (3x the radius of NT$10, purple/gold coin design with "3x" label)

*(Note: Dynamically scale the canvas view if large coins like 3x + 3x are selected so both coins always stay comfortably inside the viewport.)*

### 2. Core Rotation Physics & Visuals
- Start the rolling coin at the top (12 o'clock, `theta = -Math.PI / 2`) and roll clockwise (`0` to `2 * Math.PI`).
- **Center position**: `x = cx + (R + r) * Math.cos(theta)`, `y = cy + (R + r) * Math.sin(theta)`
- **Self-rotation angle**: `phi = -Math.PI / 2 + (theta + Math.PI / 2) * (1 + R / r)`
- **Clear Orientation Cues**:
  - Draw a distinct upward-pointing head/arrow graphic on the rolling coin plus a bold red radial pointer line so the user can clearly see when the coin is upright vs. upside down.
  - Draw a dashed green vertical reference line through the rolling coin's moving center (always pointing straight up) and a dashed circular orbit line showing the center's path (`radius = R + r`).
  - Drop small numbered milestone dots (`1圈`, `2圈`, `3圈`...) along the orbit path every time the rolling coin completes a full `360°` rotation.

### 3. Simple Controls & Multiplier Display
- **Controls**:
  - `播放 / 暫停 (Play / Pause)` button
  - `重置 (Reset)` button
  - Manual progress slider (`0°` to `360°`) + direct mouse/touch dragging of the outer coin around the center coin.
- **Clear Multiplier & Formula Readout**:
  - Display the exact radius ratio (`固定硬幣半徑 R : 滾動硬幣半徑 r`).
  - Show the live calculation clearly: **`總自轉圈數 = 1 (公轉) + (R ÷ r) = [Result] 圈`** (e.g., for two NT$10 coins: `1 + (1 ÷ 1) = 2.00 圈`; for NT$10 center + 0.5x small coin: `1 + (1 ÷ 0.5) = 3.00 圈`).
  - Show a real-time counter of completed rotations (`目前累積轉動：X.XX 圈`).

### 4. Verification
- Open the app in the browser preview and verify:
  1. Default state shows two NT$10 coins, and rolling 1 full orbit results in exactly `2.00` rotations with milestone markers at 6 o'clock (`1圈`) and 12 o'clock (`2圈`).
  2. Switching coins updates the coin sizes, colors, and the `1 + (R ÷ r)` multiplier formula immediately.