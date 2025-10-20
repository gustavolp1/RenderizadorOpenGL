// Created by inigo quilez - iq/2013
// https://www.youtube.com/c/InigoQuilez
// https://iquilezles.org/

// See also:
//
// Input - Keyboard    : https://www.shadertoy.com/view/lsXGzf
// Input - Microphone  : https://www.shadertoy.com/view/llSGDh
// Input - Mouse       : https://www.shadertoy.com/view/Mss3zH
// Input - Sound       : https://www.shadertoy.com/view/Xds3Rr
// Input - SoundCloud  : https://www.shadertoy.com/view/MsdGzn
// Input - Time        : https://www.shadertoy.com/view/lsXGz8
// Input - TimeDelta   : https://www.shadertoy.com/view/lsKGWV
// Inout - 3D Texture  : https://www.shadertoy.com/view/4llcR4

#define NUM_BARS 64.0
const float PI = 3.14159265359;

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // ===== Parameters =====
    float baseRadius = 0.2;      // base circle radius
    float circleWidth = 0.01;    // thickness used for ring intensity
    float colorSpeed = 2.0;      // color animation speed
    float bassScale = 0.15;      // how much the circle radius bounces with bass
    float maxBarLength = 0.2;    // maximum outward bar length
    float barGap = 0.03;         // space between circle and bar start

    // ===== Normalized coordinates =====
    vec2 uv = fragCoord.xy / iResolution.xy;
    uv -= 0.5;
    uv.x *= iResolution.x / iResolution.y;

    float dist = length(uv);
    float angle = atan(uv.y, uv.x); // -PI..PI
    float angleNorm = (angle + PI) / (2.0 * PI); // 0..1

    // ===== Sample low-frequency "bass" =====
    float bass = 0.0;
    for (int i = 0; i < 8; i++) {
        bass += texture(iChannel0, vec2(float(i) / 256.0, 0.0)).r;
    }
    bass /= 8.0;
    bass = pow(bass, 2.0);

    // Bouncing circle radius
    float circleRadius = baseRadius + bass * bassScale;

    // ===== Bars =====
    float rawIndex = floor(angleNorm * NUM_BARS);
    float barIndex = mod(rawIndex, NUM_BARS);

    float centerFreq = (barIndex + 0.5) / NUM_BARS;
    float amp = texture(iChannel0, vec2(centerFreq, 0.0)).r;
    amp = pow(amp, 1.4);

    float barLength = amp * maxBarLength;
    float barAngleWidth = (2.0 * PI) / NUM_BARS;
    float barAngleCenter = (barIndex + 0.5) * barAngleWidth - PI;

    // Angular mask
    float angleDist = abs(angle - barAngleCenter);
    angleDist = min(angleDist, PI - angleDist);
    float barMask = smoothstep(barAngleWidth * 0.65, barAngleWidth * 0.12, angleDist);

    // Radial mask — bars start slightly *after* the circle (barGap)
    float barStart = circleRadius + barGap;
    float barEnd   = barStart + barLength;

    float radialInner = smoothstep(barStart - 0.006, barStart + 0.006, dist);
    float radialOuter = 1.0 - smoothstep(barEnd - 0.006, barEnd + 0.006, dist);
    float inBar = radialInner * radialOuter;

    // ===== Circle outline (bouncing) =====
    float ring = circleWidth / max(0.0001, abs(dist - circleRadius));
    float circle = clamp(ring, 0.0, 1.6);

    // ===== Combine circle and bars =====
    float visual = max(circle, inBar * barMask);

    // ===== Animated color =====
    vec3 col = 0.5 + 0.5 * cos(colorSpeed * iTime + uv.xyx + vec3(0, 2, 4));
    col *= visual;

    fragColor = vec4(col, 1.0);
}
