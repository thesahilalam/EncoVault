"""
Timer Utilities — utils/timers.py
===================================
Provides a wrapper for measuring the wall-clock execution time of any
callable.  Time measurements are returned in milliseconds so the frontend
can display them in a human-readable format.
"""

import time


def measure_time(func, *args, **kwargs) -> tuple:
    """Execute *func* with the given arguments and measure its duration.

    Uses :func:`time.perf_counter` which provides the highest available
    resolution timer on the current platform — suitable for measuring
    short-lived operations in the millisecond range.

    Parameters
    ----------
    func:    Any callable (function, method, lambda).
    *args:   Positional arguments forwarded to *func*.
    **kwargs: Keyword arguments forwarded to *func*.

    Returns
    -------
    (result, time_ms): A 2-tuple of the function's return value and the
    elapsed time in milliseconds (float).

    Example
    -------
    >>> result, ms = measure_time(some_function, arg1, key=val)
    """
    start = time.perf_counter()
    result = func(*args, **kwargs)
    end = time.perf_counter()

    # Convert seconds to milliseconds with microsecond precision
    time_ms = (end - start) * 1_000
    return result, round(time_ms, 4)
