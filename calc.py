"""Small numeric helpers."""


def average(values):
    """Return the arithmetic mean of `values`.

    An empty input has no average, so it raises instead of quietly
    returning 0 — a silent 0 is indistinguishable from a real result.
    """
    if not values:
        raise ValueError("average() requires at least one value")

    return sum(values) / len(values)


if __name__ == "__main__":
    # Normal list
    numbers = [4, 8, 15, 16, 23, 42]
    result = average(numbers)
    print(f"average({numbers}) = {result}")
    assert result == 18.0, result

    # Single value
    print(f"average([7]) = {average([7])}")
    assert average([7]) == 7.0

    # Floats
    print(f"average([1.5, 2.5]) = {average([1.5, 2.5])}")
    assert average([1.5, 2.5]) == 2.0

    # Empty list
    try:
        average([])
    except ValueError as error:
        print(f"average([]) raised ValueError: {error}")
    else:
        raise AssertionError("empty list should have raised ValueError")

    print("all checks passed")
