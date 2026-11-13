"""
Pipeline Service — services/pipeline_service.py
=================================================
Enables chaining multiple operations (compress → encrypt, or any other
combination) in sequence on a single input string.

A *pipeline* is an ordered list of operation descriptors:

    [
        {"type": "compress", "algorithm": "rle"},
        {"type": "encrypt",  "algorithm": "caesar", "options": {"shift": 7}},
    ]

Each step receives the ``output_text`` produced by the previous step as its
input, allowing arbitrary compositions of the supported algorithms.

This is a deliberately simple, serial pipeline — no parallelism or DAG
support.  Its purpose is educational: demonstrating that operations can be
layered on top of each other (e.g. compress-then-encrypt is a common
pattern in real-world protocols).
"""

from app.services import encryption_service, compression_service
from app.utils.timers import measure_time
from app.utils.validators import validate_text_input


def process_pipeline(text: str, operations: list) -> dict:
    """Execute a sequence of operations on *text*.

    Parameters
    ----------
    text:       The initial input string.
    operations: Ordered list of operation dicts.  Each dict must have:
                - ``"type"``:      ``"encrypt"``, ``"decrypt"``,
                                   ``"compress"``, or ``"decompress"``.
                - ``"algorithm"``: Algorithm identifier string.
                - ``"options"``:   (optional) dict of algorithm parameters.

    Returns
    -------
    dict with:
        - ``"status"``:      ``"success"`` or ``"error"``.
        - ``"steps"``:       List of per-step result dicts.
        - ``"final_output"``: The output of the last step.
        - ``"total_time_ms"``: Cumulative execution time across all steps.
        - ``"original_size"``: Byte size of the initial *text*.
        - ``"final_size"``:   Byte size of the final output.
        - ``"total_reduction_percentage"``: Overall size change.

    Raises
    ------
    ValueError: If an operation type is unknown or if an intermediate step
                produces output incompatible with the next step.
    """
    validate_text_input(text)

    from app.utils.sizing import get_size_bytes, calculate_reduction

    original_size = get_size_bytes(text)
    current_input = text
    steps = []
    total_time_ms = 0.0

    for i, op in enumerate(operations):
        op_type = op.get("type", "").lower()
        algorithm = op.get("algorithm", "")
        options = op.get("options", {})

        try:
            if op_type == "encrypt":
                result = encryption_service.encrypt_text(algorithm, current_input, options)
            elif op_type == "decrypt":
                result = encryption_service.decrypt_text(algorithm, current_input, options)
            elif op_type == "compress":
                result = compression_service.compress_text(algorithm, current_input)
            elif op_type == "decompress":
                result = compression_service.decompress_text(
                    algorithm, current_input, options
                )
            else:
                raise ValueError(
                    f"Step {i}: unknown operation type '{op_type}'. "
                    "Use 'encrypt', 'decrypt', 'compress', or 'decompress'."
                )
        except (ValueError, KeyError, TypeError) as exc:
            raise ValueError(f"Step {i + 1} ({op_type}/{algorithm}): {exc}") from exc

        steps.append({
            "step": i,
            "type": op_type,
            "algorithm": algorithm,
            "time_ms": result["time_ms"],
            "input_size": result["original_size"],
            "output_size": result["processed_size"],
            "reduction_percentage": result["reduction_percentage"],
            "metadata": result.get("metadata", {}),
            "output_text": result["output_text"],
        })
        total_time_ms += result["time_ms"]

        # The output of this step becomes the input for the next step.
        # For list outputs (LZW codes), we serialise to a string temporarily.
        output = result["output_text"]
        if isinstance(output, list):
            import json
            current_input = json.dumps(output)
        else:
            current_input = str(output)

    final_size = get_size_bytes(current_input)
    reduction = calculate_reduction(original_size, final_size)

    return {
        "status": "success",
        "steps": steps,
        "metadata": {"steps": [step["metadata"] for step in steps]},
        "final_output": current_input,
        "output_text": current_input,
        "total_time_ms": round(total_time_ms, 4),
        "time_ms": round(total_time_ms, 4),
        "original_size": original_size,
        "final_size": final_size,
        "processed_size": final_size,
        "reduction_percentage": reduction,
        "total_reduction_percentage": reduction,
    }
