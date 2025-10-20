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

const float PI = 3.14159265359;

// simple hash for pseudo-random star positions
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float radialStars(vec2 uv, float time, float radiusStart) {
    float brightness = 0.0;
    int STAR_COUNT = 150;

    for (int i = 0; i < STAR_COUNT; i++) {
        float rnd = hash(vec2(float(i), 0.0));
        float angle = hash(vec2(float(i), 1.0)) * 2.0 * PI;
        float r0 = hash(vec2(float(i), 2.0));
        float speed = 0.1 + hash(vec2(float(i), 3.0)) * 0.3;
        float starBright = 0.5 + hash(vec2(float(i), 4.0)) * 0.8;

        // linear radial motion outward
        float r = r0 + time * speed;
        r = mod(r, 1.0);

        // convert polar to Cartesian
        vec2 starPos = vec2(cos(angle), sin(angle)) * r;

        // distance from current pixel
        float d = length(uv - starPos);
        float star = smoothstep(0.015, 0.0, d) * starBright;

        // mask only outside circle radius
        if (length(uv) < radiusStart) star = 0.0;

        brightness += star;
    }

    return brightness;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {

    // Params
    float baseRadius = 0.2;
    float circleWidth = 0.01;
    float colorSpeed = 2.0;
    float bassScale = 0.15;
    float maxBarLength = 0.2;
    float barGap = 0.03;
    float num_bars = 64.0;

    // Normalized coordinates
    vec2 uv = fragCoord.xy / iResolution.xy;
    uv -= 0.5;
    uv.x *= iResolution.x / iResolution.y;

    float dist = length(uv);
    float angle = atan(uv.y, uv.x);
    float angleNorm = (angle + PI) / (2.0 * PI);

    // Sample low freq
    float bass = 0.0;
    for (int i = 0; i < 8; i++) {
        bass += texture(iChannel0, vec2(float(i) / 256.0, 0.0)).r;
    }
    bass /= 8.0;
    bass = pow(bass, 2.0);

    // Bouncing circle radius
    float circleRadius = baseRadius + bass * bassScale;

    // Bars
    float rawIndex = floor(angleNorm * num_bars);
    float barIndex = mod(rawIndex, num_bars);

    float centerFreq = ((barIndex + 0.5) / num_bars) * 0.5;
    float amp = texture(iChannel0, vec2(centerFreq, 0.0)).r;
    amp = pow(amp, 1.4);

    float barLength = amp * maxBarLength;
    float barAngleWidth = (2.0 * PI) / num_bars;
    float barAngleCenter = (barIndex + 0.5) * barAngleWidth - PI;

    float angleDist = abs(angle - barAngleCenter);
    angleDist = min(angleDist, PI - angleDist);
    float barMask = smoothstep(barAngleWidth * 0.65, barAngleWidth * 0.12, angleDist);

    float barStart = circleRadius + barGap;
    float barEnd   = barStart + barLength;

    float radialInner = smoothstep(barStart - 0.006, barStart + 0.006, dist);
    float radialOuter = 1.0 - smoothstep(barEnd - 0.006, barEnd + 0.006, dist);
    float inBar = radialInner * radialOuter;

    // Circle outline
    float ring = circleWidth / max(0.0001, abs(dist - circleRadius));
    float circle = clamp(ring, 0.0, 1.6);

    // Animated color
    vec3 col = 0.5 + 0.5 * cos(colorSpeed * iTime + uv.xyx + vec3(0, 2, 4));
    col *= max(circle, inBar * barMask);

    // Starfield
    float stars = radialStars(uv, iTime, circleRadius);
    col += col * stars * 1.5;

    fragColor = vec4(col, 1.0);
}
