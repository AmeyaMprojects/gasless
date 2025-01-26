app.post("/relay", async (req, res) => {
  const { request, signature } = req.body;

  try {
    // Convert string values back to BigInt
    const processedRequest = {
      ...request,
      value: BigInt(request.value),
      gas: BigInt(request.gas),
      nonce: BigInt(request.nonce),
    };

    console.log("Processed Request:", processedRequest); // Debugging

    const tx = await forwarder.execute(processedRequest, signature, { gasLimit: 1000000 });
    await tx.wait();

    res.send({ success: true, txHash: tx.hash });
  } catch (error) {
    console.error("Relay error:", error); // Debugging
    res.status(500).send({ success: false, error: error.message });
  }
});