use poseidon::poseidon2;

pub struct Note {
    pub owner: Field,
    pub value: Field,
    pub secret: Field,
}

impl Note {
    pub fn new(owner: Field, value: Field, secret: Field) -> Note {
        Note { owner, value, secret }
    }

    pub fn commit(self) -> Field {
        let input = [self.owner, self.value, self.secret];
        poseidon2::Poseidon2::hash(input, input.len())
    }

    pub fn generate_nullifer(self) -> Field {
        let input = [self.commit(), self.secret];
        poseidon2::Poseidon2::hash(input, input.len())
    }

    pub fn verify_commitment(self, commitment: Field) -> bool {
        self.commit() == commitment
    }
}

// ------- tests -------

#[test]
pub fn test_note_creation() {
    let note = Note::new(1, 100, 1234);
    assert(note.owner == 1);
    assert(note.value == 100);
    assert(note.secret == 1234);
}

#[test]
pub fn test_commitment_deterministic() {
    let note_1 = Note::new(1, 100, 1234);
    let note_2 = Note::new(1, 100, 1234);
    println([note_1.commit(), note_2.commit()]);
    assert(note_1.commit() == note_2.commit());
}

#[test]
pub fn test_commitment_uniqueness() {
    let note_1 = Note::new(1, 100, 1234);
    let note_2 = Note::new(1, 100, 1233);

    println([note_1.commit(), note_2.commit()]);
    assert(note_1.commit() != note_2.commit());
}

#[test]
pub fn test_nullifer_deterministic() {
    let note_1 = Note::new(1, 100, 1234);
    let note_2 = Note::new(1, 100, 1234);
    println([note_1.generate_nullifer(), note_2.generate_nullifer()]);
    assert(note_1.generate_nullifer() == note_2.generate_nullifer());
}

#[test]
pub fn test_nullifier_uniqueness() {
    let note_1 = Note::new(1, 100, 1234);
    let note_2 = Note::new(1, 100, 1233);

    println([note_1.generate_nullifer(), note_2.generate_nullifer()]);
    assert(note_1.generate_nullifer() != note_2.generate_nullifer());
}

#[test]
fn test_verify_commitment() {
    let note_1 = Note::new(1, 100, 1234);
    assert(note_1.verify_commitment(note_1.commit()));
}
