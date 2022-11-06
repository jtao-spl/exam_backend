const ElementFirstType={
    SizedElement: 0,
    GeometricalTolerance: 1,
    SurfaceRoughness: 2,
    Other: 3
}
 const SizedElementSubType={
    Line: 0,
    Diameter: 1,
    Radial: 2,
    Angle: 3
}
 const SizedElementSymbol = ['L','D','R', '∠'];
 const GelToleranceSymbol = ['u','c','e','g','k','d','f','b','a','r','i','j','h','t'];
 module.exports={ ElementFirstType, SizedElementSubType, SizedElementSymbol, GelToleranceSymbol}