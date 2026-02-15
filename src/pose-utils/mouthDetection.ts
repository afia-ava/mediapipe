export function isMouthOpen(faceResult: any): boolean {
    if (!faceResult || !faceResult.faceBlendshapes?.[0]) return false;

    // Find the 'jawOpen' score
    const jawOpenShape = faceResult.faceBlendshapes[0].categories.find(
        (c: any) => c.categoryName === "jawOpen"
    );

    //Return true if jaw open is >30%
    return (jawOpenShape?.score || 0) > 0.3;
}
