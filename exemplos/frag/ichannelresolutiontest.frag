void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

    vec4 c0 = texture(iChannel0, fragCoord/iChannelResolution[0].xy);
    vec4 c1 = texture(iChannel1, fragCoord/iChannelResolution[1].xy);
    vec4 c2 = texture(iChannel2, fragCoord/iChannelResolution[2].xy);
    vec4 c3 = texture(iChannel3, fragCoord/iChannelResolution[3].xy);
    
    vec4 t = vec4(mod(iTime,8.0));
    
    // 0 c0, 1 c01, 2 c1, 3 c12, 4 c2, 5 c23, 6 c3, 7 c30, repeat!
    vec4 c01 = mix(c0, c1, clamp(t-1.0, vec4(0.0), vec4(1.0)));
    vec4 c23 = mix(c2, c3, clamp(t-5.0, vec4(0.0), vec4(1.0)));
    vec4 c0123 = mix(c01, c23, clamp(t-3.0, vec4(0.0), vec4(1.0)));
    
    
    fragColor = c0123;
}
