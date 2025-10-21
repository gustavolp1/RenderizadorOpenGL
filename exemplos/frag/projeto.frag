// background effect "trippy mandala" by windinmind
// adapted from: https://www.shadertoy.com/view/tf33dm

const float PI = 3.14159265359;

// pseudo-random hash
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

        // move stars outward
        float r = r0 + time * speed;
        r = mod(r, 1.0);

        // star lifetime fade
        float fadeIn = smoothstep(0.0, 0.1, r); 
        float fadeOut = (1.0 - smoothstep(0.2, 1.0, r));
        float lifetime = fadeIn * fadeOut;

        // polar to cartesian
        vec2 starPos = vec2(cos(angle), sin(angle)) * r;

        // distance to pixel
        float d = length(uv - starPos);
        float star = smoothstep(0.015, 0.0, d) * starBright * lifetime;

        // mask stars inside circle
        if (length(uv) < radiusStart) star = 0.0;

        brightness += star;
    }

    return brightness;
}

// sdf: equilateral triangle
float sdEquiTriangle( vec2 p, float r )
{
    float k = sqrt(3.0);
    p.x = abs(p.x) - r;
    p.y = p.y + r/k;
    if( p.x+k*p.y > 0.0 ) p = vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;
    p.x -= clamp( p.x, -2.0*r, 0.0 );
    return -length(p)*sign(p.y);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {

    // parameters
    float baseRadius = 0.2;
    float circleWidth = 0.01;
    float colorSpeed = 2.0;
    float bassScale = 0.15;
    float maxBarLength = 0.2;
    float barGap = 0.03;
    float num_bars = 64.0;
    float displacementStrength = 0.02;

    // normalized uv
    vec2 uv = fragCoord.xy / iResolution.xy;
    uv -= 0.5;
    uv.x *= iResolution.x / iResolution.y;

    // pre-displacement uv for background
    float orig_dist = length(uv);
    float orig_angle = atan(uv.y, uv.x);

    // get bass from audio texture
    float bass = 0.0;
    for (int i = 0; i < 8; i++) {
        bass += texture(iChannel0, vec2(float(i) / 256.0, 0.0)).r;
    }
    bass /= 8.0;
    bass = pow(bass, 2.0);

    // procedural color
    vec3 base_col = 0.5 + 0.5 * cos(colorSpeed * iTime + uv.xyx + vec3(0, 2, 4));

    // "trippy mandala"
    float n = 8.0 + bass * 10.0;
    
    vec2 uv2 = vec2(cos(fract(n * orig_angle * 0.5 / PI + iTime) - iTime) * orig_dist,
                    sin(fract(n * orig_angle * 0.5 / PI - iTime) - iTime) * orig_dist);
    
    uv2 += sin(length(uv2) * (20.0 + bass * 5.0)) / 5.;
    uv2 -= iTime * (0.2 + bass * 0.3);
    
    float b = sin(sin(cos(uv2.x * 5.) * 6.3) * 6.3) + cos(sin(sin(uv2.y * 7.) * 6.3) * 6.3);
    b += 2.;
    b = log(b) / log(4.);
    
    vec3 bg_col = base_col * b * 0.1;

    // uv displacement (camera shake/zoom)
    float displacement = bass * displacementStrength;
    uv *= (1.0 - displacement); // zoom effect
    uv += vec2(sin(iTime * 10.0) * displacement * 0.1, cos(iTime * 12.0) * displacement * 0.1); // subtle shake

    // get displaced uv for foreground
    float dist = length(uv);
    float angle = atan(uv.y, uv.x);
    float angleNorm = (angle + PI) / (2.0 * PI);

    // circle radius reacts to bass
    float circleRadius = baseRadius + bass * bassScale;

    // audio visualizer bars
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

    // circle outline
    float ring = circleWidth / max(0.0001, abs(dist - circleRadius));
    float circle = clamp(ring, 0.0, 1.6);

    // rotating triangle
    float rotAngle = iTime * 0.5 + bass * 5.0; 
    float c = cos(rotAngle);
    float s = sin(rotAngle);
    vec2 uv_tri = uv * mat2(c, -s, s, c); 
    
    float triRadius = 0.08 + bass * 0.08;
    float triSDF = sdEquiTriangle(uv_tri, triRadius);
    float triangle = 1.0 - smoothstep(0.0, 0.005, triSDF);
    float glow_triangle = 1.0 - smoothstep(0.0, 0.04, triSDF);

    // combine shapes
    float shape = max(circle, max(inBar * barMask, triangle));

    // circle glow
    float glow_circle = smoothstep(circleWidth + 0.04, circleWidth * 0.5, abs(dist - circleRadius));

    // bar glow
    float glowRadialInner = smoothstep(barStart - 0.02, barStart + 0.02, dist);
    float glowRadialOuter = 1.0 - smoothstep(barEnd - 0.02, barEnd + 0.02, dist);
    float glowAngleMask = smoothstep(barAngleWidth * 8.0, barAngleWidth * 0.1, angleDist);
    float glow_bar = (glowRadialInner * glowRadialOuter) * glowAngleMask;

    // combine glows
    float glow = max(max(glow_circle, glow_bar), glow_triangle) * 0.4;
    
    // apply shapes to color
    vec3 visualizer_col = base_col * (shape + glow);

    // starfield
    float stars = radialStars(uv, iTime, circleRadius); 
    
    // add stars
    vec3 star_col = base_col * stars * 1.5; 

    // combine layers
    vec3 final_col = bg_col + visualizer_col + star_col;

    fragColor = vec4(final_col, 1.0);
}