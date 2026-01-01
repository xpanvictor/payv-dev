mod models;

use models::Note;

fn main(note: Note) {
    // TODO: Add actual circuit logic
    let _commitment = note.commit();
}

#[test]
fn test_main() {
    main(1, 2);

    // Uncomment to make test fail
    // main(1, 1);
}
